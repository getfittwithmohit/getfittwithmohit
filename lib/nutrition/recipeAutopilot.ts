// Server-only. Recipe Autopilot: keeps the recipe book full without Coach
// Mohit writing or checking recipes one by one.
//
// One run = one batch (fits a single 300 s function call):
//   1. Plate coverage — dishes on clients' published plans with no recipe yet.
//   2. Book gaps     — main proteins with fewer than BOOK_PER_PROTEIN recipes.
//   3. Rewrites      — live recipes clients keep saying no to.
// Every new recipe is written, then reviewed and fixed by a second AI, then
// checked in code (macros come from the food library). If Autopilot is on and
// both pass, it goes live; otherwise it waits for the coach with a reason.

import { admin, loadFoods } from './ai'
import { draftRecipes, editRecipe, reviewRecipes } from './recipeAi'
import { PROTEIN_KEYS, recipeChecks, type ProteinKey, type Recipe, type RecipeReview } from './recipes'
import type { PlanDoc } from './plan'

export const BOOK_PER_PROTEIN = 5 // 8 proteins × 5 ≈ 40 recipes
const BATCH = 6

export interface AutopilotStatus {
  autopilot: boolean
  live: number
  waiting: number
  plateDishes: number
  plateCovered: number
  book: Record<ProteinKey, number>
  bookTarget: number
  lastRunAt: string | null
  lastSummary: RunSummary | null
}

export interface RunSummary {
  at: string
  kind: 'plates' | 'book' | 'rewrite' | 'nothing'
  added: number
  published: number
  waiting: number
  titles: string[]
}

type Row = Pick<Recipe, 'id' | 'title' | 'protein_key' | 'dish_food' | 'status' | 'likes' | 'dislikes'> & Recipe

async function loadState() {
  const [settings, recipes, plans] = await Promise.all([
    admin.from('recipe_settings').select('*').eq('id', 1).maybeSingle(),
    admin.from('recipes').select('*'),
    admin.from('nutrition_plans').select('published').eq('status', 'active').not('published', 'is', null),
  ])
  if (recipes.error) throw new Error(recipes.error.message)
  const rows = (recipes.data || []) as Row[]
  const planSlugs = new Set<string>()
  for (const p of plans.data || []) {
    for (const m of ((p.published as PlanDoc)?.meals || [])) for (const o of m.options || []) for (const it of o.items || []) planSlugs.add(it.food)
  }
  return { settings: settings.data, rows, planSlugs }
}

export async function autopilotStatus(): Promise<AutopilotStatus> {
  const { settings, rows, planSlugs } = await loadState()
  const foods = await loadFoods()
  const dishSlugs = foods.filter((f) => f.kind === 'dish' && planSlugs.has(f.slug)).map((f) => f.slug)
  const covered = new Set(rows.filter((r) => r.status === 'approved' && r.dish_food).map((r) => r.dish_food))
  const book = Object.fromEntries(PROTEIN_KEYS.map((p) => [p, 0])) as Record<ProteinKey, number>
  for (const r of rows) if (r.status === 'approved') book[r.protein_key]++
  return {
    autopilot: settings?.autopilot ?? true,
    live: rows.filter((r) => r.status === 'approved').length,
    waiting: rows.filter((r) => r.status === 'draft').length,
    plateDishes: dishSlugs.length,
    plateCovered: dishSlugs.filter((s) => covered.has(s)).length,
    book,
    bookTarget: BOOK_PER_PROTEIN,
    lastRunAt: settings?.last_run_at ?? null,
    lastSummary: (settings?.last_summary as RunSummary) ?? null,
  }
}

export async function runAutopilot(): Promise<RunSummary & { done: boolean }> {
  const { settings, rows, planSlugs } = await loadState()
  const autopilot = settings?.autopilot ?? true
  const foods = await loadFoods()
  const bySlug = new Map(foods.map((f) => [f.slug, f]))
  const alive = rows.filter((r) => r.status !== 'rejected')
  const existingTitles = alive.map((r) => r.title)

  // 1. Plate dishes with no recipe at all (a waiting draft counts: don't redo it)
  const haveDish = new Set(alive.map((r) => r.dish_food).filter(Boolean))
  const dishGaps = foods.filter((f) => f.kind === 'dish' && f.is_active && planSlugs.has(f.slug) && !haveDish.has(f.slug)).map((f) => f.slug)

  // 2. Proteins short of recipes (live + waiting)
  const count = Object.fromEntries(PROTEIN_KEYS.map((p) => [p, 0])) as Record<ProteinKey, number>
  for (const r of alive) count[r.protein_key]++
  const bookGaps = PROTEIN_KEYS.filter((p) => count[p] < BOOK_PER_PROTEIN).sort((a, b) => count[a] - count[b])

  // 3. Live recipes clients don't like (3+ votes, more no than yes)
  const unloved = rows.filter((r) => r.status === 'approved' && (r.dislikes || 0) >= 3 && (r.dislikes || 0) > (r.likes || 0))

  let kind: RunSummary['kind'] = 'nothing'
  let drafts: Omit<Recipe, 'id' | 'status'>[] = []
  let rewrite: Row[] = []

  if (dishGaps.length) {
    kind = 'plates'
    const asked = dishGaps.slice(0, BATCH)
    drafts = await draftRecipes({ foods, count: asked.length, proteins: [], meals: [], notes: '', existingTitles, dishes: asked })
    // One recipe per dish, in order: pin the plate link so a dish is never redone
    drafts = drafts.slice(0, asked.length).map((d, i) => ({ ...d, dish_food: asked[i] }))
  } else if (bookGaps.length) {
    kind = 'book'
    const need = bookGaps.reduce((s, p) => s + (BOOK_PER_PROTEIN - count[p]), 0)
    drafts = await draftRecipes({ foods, count: Math.min(BATCH, need), proteins: bookGaps.slice(0, 3), meals: [], notes: '', existingTitles })
    // A dish links to one recipe only: unlink book recipes whose dish is taken
    const taken = new Set(haveDish)
    drafts = drafts.map((d) => {
      if (!d.dish_food || taken.has(d.dish_food)) return { ...d, dish_food: null }
      taken.add(d.dish_food)
      return d
    })
  } else if (unloved.length) {
    kind = 'rewrite'
    rewrite = unloved.slice(0, 2)
    for (const r of rewrite) {
      const { recipe } = await editRecipe({
        foods, recipe: r,
        instruction: `Clients who cooked this said they wouldn't cook it again (${r.likes || 0} yes, ${r.dislikes || 0} no). Make it noticeably tastier and easier — better masala balance, fresher finish, simpler method — while keeping it the same kind of dish, the same main protein and the same macros.`,
      })
      drafts.push(recipe)
    }
  }

  const reviewed = drafts.length ? await reviewRecipes({ foods, drafts }) : []
  const decide = (recipe: Omit<Recipe, 'id' | 'status'>, review: RecipeReview) => {
    const failing = recipeChecks({ ...recipe, id: '', status: 'draft' } as Recipe, bySlug).filter((c) => !c.ok)
    const pass = review.verdict === 'publish' && failing.length === 0
    const reason = failing.length && review.verdict === 'publish'
      ? `Check failed: ${failing.map((c) => `${c.label} (${c.value})`).join('; ')}`
      : review.reason
    return { pass, review: { ...review, reason } }
  }

  let published = 0
  let waiting = 0
  const titles: string[] = []
  const now = new Date().toISOString()

  if (kind === 'rewrite') {
    for (let i = 0; i < reviewed.length; i++) {
      const { recipe, review } = reviewed[i]
      const { pass, review: rv } = decide(recipe, review)
      const keepLive = autopilot && pass
      // A rewrite that passes replaces the live recipe and resets its votes;
      // one that doesn't is kept for the coach and the live version stays up.
      if (keepLive) {
        await admin.from('recipes').update({ ...recipe, review: rv, likes: 0, dislikes: 0, updated_at: now }).eq('id', rewrite[i].id)
        await admin.from('recipe_feedback').delete().eq('recipe_id', rewrite[i].id)
        published++
      } else {
        await admin.from('recipes').insert({ ...recipe, status: 'draft', source: 'autopilot', review: { ...rv, reason: `Rewrite of “${rewrite[i].title}” (clients said no): ${rv.reason}` } })
        waiting++
      }
      titles.push(recipe.title)
    }
  } else if (reviewed.length) {
    const rowsToInsert = reviewed.map(({ recipe, review }) => {
      const { pass, review: rv } = decide(recipe, review)
      const live = autopilot && pass
      if (live) published++
      else waiting++
      titles.push(recipe.title)
      return { ...recipe, status: live ? 'approved' : 'draft', approved_at: live ? now : null, source: 'autopilot', review: rv }
    })
    const { error } = await admin.from('recipes').insert(rowsToInsert)
    if (error) throw new Error(error.message)
  }

  const summary: RunSummary = { at: now, kind, added: drafts.length, published, waiting, titles }
  if (kind !== 'nothing') {
    await admin.from('recipe_settings').upsert({ id: 1, autopilot, last_run_at: now, last_summary: summary })
  }
  // Done when nothing was left to do before this batch, or this batch covered the last of it
  const done = kind === 'nothing'
    || (kind === 'plates' && dishGaps.length <= BATCH && !bookGaps.length && !unloved.length)
    || (kind === 'book' && bookGaps.reduce((s, p) => s + (BOOK_PER_PROTEIN - count[p]), 0) <= BATCH && !unloved.length)
    || (kind === 'rewrite' && unloved.length <= 2)
  return { ...summary, done }
}
