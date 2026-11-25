// Server-only. The AI recipe writer: drafts recipes in Coach Mohit's voice and
// edits one from a plain-language instruction. Ingredients may only be foods
// from the GFM food library (enforced by the output schema), so every number
// the client sees is calculated from the library, never from the model.

import { callClaude, MODEL } from './ai'
import { nutrientsFor, type Food } from './foods'
import {
  MEAL_TYPES, PROTEIN_KEYS, RECIPE_TAGS, dietOf,
  type MealType, type ProteinKey, type Recipe, type RecipeExtra, type RecipeIngredient, type RecipeTranslation,
} from './recipes'

const STR = { type: 'string' }
const NUM = { type: 'number' }
const BOOL = { type: 'boolean' }
const arr = (items: object) => ({ type: 'array', items })
const obj = (properties: Record<string, object>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false })

const recipeSchema = (ingredientSlugs: string[], dishSlugs: string[]) => obj({
  title: STR,
  protein_key: { type: 'string', enum: [...PROTEIN_KEYS] },
  meal_types: arr({ type: 'string', enum: [...MEAL_TYPES] }),
  minutes: NUM,
  equipment: arr(STR),
  tags: arr({ type: 'string', enum: [...RECIPE_TAGS] }),
  portion_label: STR,
  ingredients: arr(obj({ food: { type: 'string', enum: ingredientSlugs }, grams: NUM, prep: STR, is_protein: BOOL })),
  extras: arr(obj({ name: STR, amount: STR })),
  steps: arr(obj({ text: STR, minutes: NUM })),
  tip: STR,
  swaps: arr(obj({ food: { type: 'string', enum: ingredientSlugs }, note: STR })),
  dish_food: { type: 'string', enum: [...dishSlugs, ''] },
})

type RawRecipe = Omit<Recipe, 'id' | 'diet' | 'jain_ok' | 'status' | 'dish_food' | 'tip' | 'portion_label'> & {
  dish_food: string; tip: string; portion_label: string
}

const VOICE = `You are Coach Mohit Mehral's recipe writer — the standard of the world's best nutrition coaches, applied to Indian home cooking. Mohit is an ISSA-certified nutritionist and transformation coach in Mumbai. His clients are busy professionals and their families; anyone in the home might cook (the client, a spouse, a parent or a hired cook).

WRITING RULES (everything the client or cook reads):
- Written as Mohit. Never mention AI, models, systems or apps. No brand names. No medical claims.
- Plain, warm, direct English. Indian kitchen words are good (katori, kadhai, tadka, tawa, tiffin). Short sentences.
- Titles: the dish name people say at home, e.g. "Masala paneer bhurji", "Dahi chicken (no-cream)". Max 5 words.
- Steps: one action each, imperative, max 22 words. Never repeat quantities in steps (the app shows amounts sized for the family). Mention heat level and doneness cues ("till the oil separates", "till golden"). 3–8 steps. "minutes" = active time for that step (0 if none).
- tip: ONE "where calories hide" tip specific to this dish, with a number where possible, max 24 words (e.g. "Skip the butter finish — saves about 90 kcal per portion.").
- portion_label: what the client's portion looks like on the plate, e.g. "1½ katori", "2 chillas", "1 bowl".

COOKING RULES:
- Real Indian home food a family would happily eat. Weekday recipes (tag "weekday") take ≤ 20 minutes of total time; anything longer is tagged "sunday_prep" (batch cook) instead. Add "tiffin" if it packs well, "no_cook" if no heat is needed.
- Common equipment only: pressure cooker, kadhai, tawa, non-stick pan, mixer, microwave (optional). No oven, no air fryer unless the dish is unchanged without it.
- Oil or ghee: at most 1 tsp (5 g) per portion in total. No cream, no butter finish, no deep frying, no added sugar.

NUMBERS:
- ingredients = the counted foods for ONE client portion, RAW weights in grams, ONLY foods from the CATALOG by slug. Exactly one ingredient has is_protein = true: the main protein the recipe is built around.
- Protein per portion ≥ 20 g for breakfast/lunch/dinner recipes, ≥ 10 g for snacks. Use the per-100 g values in the catalog to check before answering. Typical main-meal portion: 300–450 kcal.
- extras = spices, herbs, salt, lemon, water — anything not in the catalog that the cook still needs, with an amount per portion ("¼ tsp", "to taste", "a few leaves").
- swaps: 2–4 OTHER main proteins from the catalog that genuinely work with the same masala and method, from different protein families (e.g. paneer → tofu, soya, eggs, chicken), each with a short note on what changes (max 12 words). The app re-weighs each swap to match the protein; you only name the food.
- dish_food: if a DISH in the dish list is what this recipe makes, its slug (so it links from clients' plans); else "".`

// Counted ingredients: one line each with per-100 g values.
function ingredientCatalog(foods: Food[]): string {
  return foods
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    .map((f) => `${f.slug} | ${f.name}${f.local_name ? ` (${f.local_name})` : ''} | ${f.category} | per100g ${Math.round(f.kcal)}kcal P${f.protein_g} C${f.carbs_g} F${f.fat_g} | ${f.diet}${f.is_vegan ? ',vegan' : ''}`)
    .join('\n')
}

function pools(all: Food[]) {
  const active = all.filter((f) => f.is_active)
  return {
    ingredients: active.filter((f) => f.kind === 'ingredient'),
    dishes: active.filter((f) => f.kind === 'dish'),
  }
}

// Tidy what the model returned so the coach never sees broken data.
export function normaliseRecipe(raw: RawRecipe, bySlug: Map<string, Food>): Omit<Recipe, 'id' | 'status'> {
  const ingredients: RecipeIngredient[] = (raw.ingredients || [])
    .filter((i) => bySlug.has(i.food) && Number(i.grams) > 0)
    .map((i) => ({ food: i.food, grams: Math.round(Number(i.grams)), prep: (i.prep || '').trim() || undefined, is_protein: !!i.is_protein }))
  // Exactly one main protein: keep the first marked, else the richest source.
  const marked = ingredients.findIndex((i) => i.is_protein)
  const best = marked >= 0 ? marked : ingredients.reduce((bi, i, idx) => {
    const p = (f: RecipeIngredient) => nutrientsFor(bySlug.get(f.food)!, f.grams).protein
    return bi < 0 || p(i) > p(ingredients[bi]) ? idx : bi
  }, -1)
  ingredients.forEach((i, idx) => { i.is_protein = idx === best })
  const main = ingredients[best]?.food
  const seen = new Set<string>()
  const swaps = (raw.swaps || []).filter((s) => {
    if (!bySlug.has(s.food) || s.food === main || seen.has(s.food)) return false
    seen.add(s.food)
    return true
  }).slice(0, 5).map((s) => ({ food: s.food, note: (s.note || '').trim() || undefined }))
  return {
    title: (raw.title || 'Untitled recipe').trim(),
    protein_key: (PROTEIN_KEYS as readonly string[]).includes(raw.protein_key) ? raw.protein_key : 'paneer',
    meal_types: (raw.meal_types || []).filter((m): m is MealType => (MEAL_TYPES as readonly string[]).includes(m)),
    minutes: Math.max(1, Math.round(Number(raw.minutes) || 20)),
    equipment: (raw.equipment || []).map((e) => e.trim()).filter(Boolean).slice(0, 4),
    tags: (raw.tags || []).filter((t) => (RECIPE_TAGS as readonly string[]).includes(t)),
    portion_label: (raw.portion_label || '').trim() || null,
    ingredients,
    extras: (raw.extras || []).map((e) => ({ name: (e.name || '').trim(), amount: (e.amount || '').trim() || 'to taste' })).filter((e) => e.name).slice(0, 12),
    steps: (raw.steps || []).map((s) => ({ text: (s.text || '').trim(), minutes: Number(s.minutes) > 0 ? Math.round(Number(s.minutes)) : null })).filter((s) => s.text).slice(0, 10),
    tip: (raw.tip || '').trim() || null,
    swaps,
    dish_food: raw.dish_food && bySlug.has(raw.dish_food) ? raw.dish_food : null,
    ...dietOf(ingredients, bySlug),
    ai_model: MODEL,
  }
}

export async function draftRecipes(args: {
  foods: Food[]
  count: number
  proteins: ProteinKey[]
  meals: MealType[]
  notes: string
  existingTitles: string[]
}): Promise<Omit<Recipe, 'id' | 'status'>[]> {
  const { ingredients, dishes } = pools(args.foods)
  const bySlug = new Map(args.foods.map((f) => [f.slug, f]))
  const schema = obj({ recipes: arr(recipeSchema(ingredients.map((f) => f.slug), dishes.map((f) => f.slug))) })
  const proteins = args.proteins.length ? args.proteins : [...PROTEIN_KEYS]
  const meals = args.meals.length ? args.meals : ['breakfast', 'lunch', 'dinner', 'snack']

  const prompt = `${VOICE}

TASK: Write ${args.count} new recipes for the GFM recipe book.
- Spread them across these main proteins: ${proteins.join(', ')} (as evenly as the count allows).
- Spread them across these meals: ${meals.join(', ')}. A recipe may suit more than one meal.
- Variety: different cooking styles (bhurji, curry, tikka, chilla, salad, wrap, khichdi, stir-fry…) and regions (Maharashtrian, Punjabi, South Indian, Gujarati, coastal). Mostly weekday recipes; at most 1 in 5 tagged "sunday_prep".
- Do NOT repeat any of these existing recipes: ${args.existingTitles.length ? args.existingTitles.join('; ') : '(none yet)'}.
${args.notes.trim() ? `\nCOACH'S NOTES (follow these):\n"""\n${args.notes.slice(0, 3000)}\n"""\n` : ''}
Keep every text field short. No padding.

DISHES that already exist in client plans (for dish_food):
${dishes.map((d) => `${d.slug} | ${d.name}`).join('\n')}

CATALOG of counted ingredients (slug | name (local) | category | per 100 g | diet):
${ingredientCatalog(ingredients)}`

  const out = await callClaude<{ recipes: RawRecipe[] }>(prompt, schema, 24000)
  return (out.recipes || []).map((r) => normaliseRecipe(r, bySlug))
}

export async function editRecipe(args: { foods: Food[]; recipe: Recipe; instruction: string }): Promise<{ recipe: Omit<Recipe, 'id' | 'status'>; summary: string[] }> {
  const { ingredients, dishes } = pools(args.foods)
  const bySlug = new Map(args.foods.map((f) => [f.slug, f]))
  // Never let a food already in the recipe be rejected by the schema
  const slugs = Array.from(new Set([...ingredients.map((f) => f.slug), ...args.recipe.ingredients.map((i) => i.food), ...args.recipe.swaps.map((s) => s.food)]))
    .filter((s) => bySlug.has(s))
  const schema = obj({ recipe: recipeSchema(slugs, dishes.map((f) => f.slug)), summary: arr(STR) })
  const { id: _id, status: _status, diet: _diet, jain_ok: _jain, ai_model: _m, approved_at: _a, created_at: _c, updated_at: _u, ...current } = args.recipe
  void _id; void _status; void _diet; void _jain; void _m; void _a; void _c; void _u

  const prompt = `${VOICE}

TASK: Change this recipe exactly as the coach asks. Keep everything else the same. Return the whole recipe, plus "summary": 1–4 short lines saying what changed.

COACH'S INSTRUCTION:
"""
${args.instruction.slice(0, 3000)}
"""

CURRENT RECIPE (JSON):
${JSON.stringify(current)}

DISHES (for dish_food):
${dishes.map((d) => `${d.slug} | ${d.name}`).join('\n')}

CATALOG of counted ingredients (slug | name (local) | category | per 100 g | diet):
${ingredientCatalog(args.foods.filter((f) => slugs.includes(f.slug)))}`

  const out = await callClaude<{ recipe: RawRecipe; summary: string[] }>(prompt, schema, 8000)
  return { recipe: normaliseRecipe(out.recipe, bySlug), summary: (out.summary || []).slice(0, 4) }
}

// ── Translation for "Send to whoever's cooking" ─────────────────────────────

const LANG_NAME = { hi: 'Hindi', mr: 'Marathi' } as const

export async function translateRecipe(args: { recipe: Recipe; foods: Food[]; lang: 'hi' | 'mr' }): Promise<Omit<RecipeTranslation, 'at'>> {
  const bySlug = new Map(args.foods.map((f) => [f.slug, f]))
  const slugs = Array.from(new Set([...args.recipe.ingredients.map((i) => i.food), ...args.recipe.swaps.map((s) => s.food)])).filter((s) => bySlug.has(s))
  const schema = obj({
    title: STR,
    names: arr(obj({ food: { type: 'string', enum: slugs }, name: STR })),
    extras: arr(obj({ name: STR, amount: STR })),
    steps: arr(STR),
    tip: STR,
  })
  const lang = LANG_NAME[args.lang]
  const prompt = `Translate this home recipe into everyday spoken ${lang}, written in Devanagari, for a home cook in Mumbai/Maharashtra (could be a family member or a hired cook). Use the words people actually say in the kitchen — common English loan words are fine where that's what people say (e.g. "capsicum", "paneer", "non-stick"). Keep it short and clear. Keep numbers as digits. Do not add or remove anything.

- title: the dish name as people say it in ${lang}.
- names: for EACH food slug below, the short everyday ${lang} name of that ingredient (e.g. "पनीर", "प्याज़"/"कांदा"). No weights, no brackets.
- extras: same order and count as given; translate name and amount.
- steps: same order and count as given.
- tip: translate.

FOODS (slug → English name):
${slugs.map((s) => `${s} → ${bySlug.get(s)!.name}${bySlug.get(s)!.local_name ? ` (${bySlug.get(s)!.local_name})` : ''}`).join('\n')}

TITLE: ${args.recipe.title}
EXTRAS: ${JSON.stringify(args.recipe.extras)}
STEPS: ${JSON.stringify(args.recipe.steps.map((s) => s.text))}
TIP: ${args.recipe.tip || ''}`

  const out = await callClaude<{ title: string; names: { food: string; name: string }[]; extras: RecipeExtra[]; steps: string[]; tip: string }>(prompt, schema, 4000)
  const names: Record<string, string> = {}
  for (const n of out.names || []) if (slugs.includes(n.food) && n.name?.trim()) names[n.food] = n.name.trim()
  // Never return a shorter list than the original: fall back to English per line.
  const steps = args.recipe.steps.map((s, i) => (out.steps?.[i] || '').trim() || s.text)
  const extras = args.recipe.extras.map((x, i) => ({ name: out.extras?.[i]?.name?.trim() || x.name, amount: out.extras?.[i]?.amount?.trim() || x.amount }))
  return { title: out.title?.trim() || args.recipe.title, names, extras, steps, tip: out.tip?.trim() || args.recipe.tip || '' }
}
