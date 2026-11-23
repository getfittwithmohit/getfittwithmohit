// Nutrition plan — the document a coach edits and a client follows.
// Pure types + math (totals, scaling, checks); no network.

import { nutrientsFor, type Food, type Nutrients } from './foods'

export type Level = 1 | 2 | 3

export interface PlanTargets {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  water_l: number
}

export interface PlanItem {
  food: string // food slug
  qty: number // how many of `measure`
  measure: string // measure label, e.g. "1 katori (150 g)"
  grams: number // grams in ONE measure
}

export interface PlanOption {
  id: string
  title: string
  items: PlanItem[]
  why: string
  tip: string
}

export interface PlanMeal {
  id: string
  name: string
  time: string
  options: PlanOption[]
}

export interface PlanDoc {
  level: Level
  targets: PlanTargets
  rules: string[]
  meals: PlanMeal[]
}

export const LEVEL_LABEL: Record<Level, string> = { 1: 'Level 1 · Habits', 2: 'Level 2 · Portions', 3: 'Level 3 · Numbers' }

export const PLATE_RULES = [
  'Half your plate: sabzi or salad',
  'A quarter: protein — dal, paneer, curd, eggs, chicken or fish',
  'A quarter: roti or rice',
  'Eat the protein first',
  'A glass of water before each meal',
]

export const newId = () => Math.random().toString(36).slice(2, 10)

export function emptyOption(): PlanOption {
  return { id: newId(), title: '', items: [], why: '', tip: '' }
}

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
const add = (a: Nutrients, b: Nutrients): Nutrients => ({
  kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fibre: a.fibre + b.fibre,
})

export const itemGrams = (i: PlanItem) => i.qty * i.grams

export function optionTotals(o: PlanOption, foods: Map<string, Food>): Nutrients {
  return o.items.reduce((t, i) => {
    const f = foods.get(i.food)
    return f ? add(t, nutrientsFor(f, itemGrams(i))) : t
  }, ZERO)
}

// A "typical day" = the first option of every meal. Also the lowest and
// highest the day can be, picking the lightest / heaviest option each meal.
export function dayTotals(doc: PlanDoc, foods: Map<string, Food>) {
  let typical = ZERO, low = ZERO, high = ZERO
  for (const m of doc.meals) {
    if (m.options.length === 0) continue
    const totals = m.options.map((o) => optionTotals(o, foods))
    typical = add(typical, totals[0])
    low = add(low, totals.reduce((a, b) => (b.kcal < a.kcal ? b : a)))
    high = add(high, totals.reduce((a, b) => (b.kcal > a.kcal ? b : a)))
  }
  return { typical, low, high }
}

// Round a portion to something a person can actually serve.
export function roundQty(qty: number, measure: string): number {
  if (/^100 g$/.test(measure)) return Math.max(0.1, Math.round(qty * 20) / 20) // 5 g steps
  return Math.max(0.5, Math.round(qty * 2) / 2) // halves: ½ roti, 1½ katori
}

// Scale a plan to a new calorie target (used when a template is given to a
// client). Portions change in steps a person can serve (½ roti, ½ katori, 10 g),
// and the starchy, low-protein items move first so protein stays put.
export function scaleDoc(doc: PlanDoc, factor: number, foods?: Map<string, Food>): PlanDoc {
  if (!foods) {
    return {
      ...doc,
      meals: doc.meals.map((m) => ({
        ...m,
        options: m.options.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i, qty: roundQty(i.qty * factor, i.measure) })) })),
      })),
    }
  }
  return { ...doc, meals: doc.meals.map((m) => ({ ...m, options: m.options.map((o) => scaleOption(o, factor, foods)) })) }
}

function scaleOption(o: PlanOption, factor: number, foods: Map<string, Food>): PlanOption {
  const items = o.items.map((i) => ({ ...i }))
  const kcalOf = () => optionTotals({ ...o, items }, foods).kcal
  const target = kcalOf() * factor
  const step = (i: PlanItem) => (i.measure === '100 g' ? 0.1 : 0.5)
  const orig = items.map((i) => i.qty)
  // carbs and fats first: highest kcal per gram of protein
  const order = items
    .map((i, idx) => {
      const f = foods.get(i.food)
      return { idx, score: f ? f.kcal / Math.max(0.5, f.protein_g) : 0 }
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.idx)
  for (let n = 0; n < 40; n++) {
    const cur = kcalOf()
    const diff = target - cur
    if (Math.abs(diff) <= Math.max(25, target * 0.04)) break
    let best: { idx: number; qty: number; gap: number } | null = null
    for (const idx of order) {
      const i = items[idx]
      const next = Math.round((i.qty + Math.sign(diff) * step(i)) * 100) / 100
      if (next < step(i) || next > orig[idx] * 4) continue
      const was = i.qty
      i.qty = next
      const gap = Math.abs(target - kcalOf())
      i.qty = was
      if (gap < Math.abs(diff) && (!best || gap < best.gap - 1)) best = { idx, qty: next, gap }
    }
    if (!best) break
    items[best.idx].qty = best.qty
  }
  return { ...o, items }
}

// ── Checks before publishing ──
export interface ClientContext {
  diet: string | null // 'Vegetarian' | 'Eggetarian' | 'Non-vegetarian' | 'Vegan' | 'Jain'
  allergies: string | null
  disliked: string | null
  conditions: string | null
}

export interface Check {
  level: 'warn' | 'block'
  text: string
}

const ALLERGEN_WORDS: Record<string, string[]> = {
  dairy: ['dairy', 'milk', 'lactose', 'paneer', 'curd', 'dahi'],
  gluten: ['gluten', 'wheat', 'celiac', 'coeliac'],
  nuts: ['nut', 'almond', 'cashew', 'walnut', 'pista'],
  peanut: ['peanut', 'groundnut', 'moongphali', 'shengdana'],
  soy: ['soy', 'soya', 'tofu'],
  egg: ['egg'],
  fish: ['fish'],
  shellfish: ['shellfish', 'prawn', 'shrimp', 'crab', 'lobster'],
  sesame: ['sesame', 'til'],
}

const words = (s: string | null) => (s || '').toLowerCase()

export function planChecks(doc: PlanDoc, foods: Map<string, Food>, ctx: ClientContext | null): Check[] {
  const out: Check[] = []
  const { typical, low } = dayTotals(doc, foods)
  const t = doc.targets
  if (doc.meals.length === 0 || doc.meals.every((m) => m.options.length === 0)) {
    out.push({ level: 'block', text: 'The plan has no meals yet.' })
    return out
  }
  const empty = doc.meals.flatMap((m) => m.options.filter((o) => o.items.length === 0).map(() => m.name))
  if (empty.length) out.push({ level: 'block', text: `Empty option in ${[...new Set(empty)].join(', ')}.` })
  if (t.protein_g > 0 && typical.protein < t.protein_g * 0.9) {
    out.push({ level: 'warn', text: `Protein on a typical day is ${Math.round(typical.protein)} g — below the ${t.protein_g} g target.` })
  }
  if (t.kcal > 0 && Math.abs(typical.kcal - t.kcal) > t.kcal * 0.1) {
    out.push({ level: 'warn', text: `A typical day is ${Math.round(typical.kcal)} kcal vs the ${t.kcal} kcal target.` })
  }
  if (low.kcal > 0 && low.kcal < 1200) out.push({ level: 'warn', text: `The lightest day is only ${Math.round(low.kcal)} kcal (below 1,200).` })
  if (t.kcal > 0 && t.kcal < 1200) out.push({ level: 'warn', text: `The calorie target is below 1,200 kcal.` })

  const used = doc.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => foods.get(i.food)).filter((f): f is Food => !!f)))
  const missing = doc.meals.flatMap((m) => m.options.flatMap((o) => o.items.filter((i) => !foods.has(i.food)).map((i) => i.food)))
  if (missing.length) out.push({ level: 'block', text: `Foods no longer in the library: ${[...new Set(missing)].join(', ')}.` })
  const inactive = [...new Set(used.filter((f) => !f.is_active).map((f) => f.name))]
  if (inactive.length) out.push({ level: 'warn', text: `Hidden from plans in your library: ${inactive.join(', ')}.` })

  if (ctx) {
    const diet = words(ctx.diet)
    const bad = (pred: (f: Food) => boolean) => [...new Set(used.filter(pred).map((f) => f.name))]
    if (diet.includes('vegan')) {
      const x = bad((f) => !f.is_vegan)
      if (x.length) out.push({ level: 'block', text: `Not vegan: ${x.join(', ')}.` })
    } else if (diet.includes('jain')) {
      const x = bad((f) => !f.is_jain_ok)
      if (x.length) out.push({ level: 'block', text: `Not Jain-friendly: ${x.join(', ')}.` })
    } else if (diet.includes('egg')) {
      const x = bad((f) => f.diet === 'nonveg')
      if (x.length) out.push({ level: 'block', text: `Non-veg in an eggetarian plan: ${x.join(', ')}.` })
    } else if (diet.includes('non')) {
      // anything goes
    } else if (diet.includes('veg')) {
      const x = bad((f) => f.diet !== 'veg')
      if (x.length) out.push({ level: 'block', text: `Egg or non-veg in a vegetarian plan: ${x.join(', ')}.` })
    }
    const allergy = words(ctx.allergies)
    if (allergy && !/^(no|none|nil|na|n\/a|nothing)\b/.test(allergy.trim())) {
      for (const [a, ws] of Object.entries(ALLERGEN_WORDS)) {
        if (ws.some((w) => allergy.includes(w))) {
          const x = bad((f) => f.allergens.includes(a))
          if (x.length) out.push({ level: 'block', text: `Allergy (${a}) — remove: ${x.join(', ')}.` })
        }
      }
    }
    const dislikes = words(ctx.disliked).split(/[,;/\n]| and /).map((s) => s.trim()).filter((s) => s.length >= 3)
    for (const d of dislikes) {
      const x = bad((f) => `${f.name} ${f.local_name || ''}`.toLowerCase().includes(d))
      if (x.length) out.push({ level: 'warn', text: `Client dislikes “${d}”: ${x.join(', ')}.` })
    }
    const cond = words(ctx.conditions)
    if (/kidney|renal|ckd|liver|cirrhosis/.test(cond)) {
      out.push({ level: 'block', text: 'Kidney or liver condition on file — confirm the protein target with their doctor before publishing.' })
    }
    if (/pregnan|breastfeed|lactat/.test(cond)) {
      out.push({ level: 'warn', text: 'Pregnancy or breastfeeding on file — keep calories at maintenance, no deficit.' })
    }
    if (/diabet|pcos|pcod|thyroid/.test(cond)) {
      out.push({ level: 'warn', text: 'Diabetes, PCOS or thyroid on file — spread carbs evenly and pair them with protein and fibre.' })
    }
  }
  return out
}

export function describeItem(i: PlanItem, food: Food | undefined, level: Level): string {
  const name = food?.name || i.food
  if (level === 1) return name
  if (level === 3) {
    const g = Math.round(itemGrams(i))
    return i.measure === '100 g' ? `${name} · ${g} g` : `${describeItem(i, food, 2)} (${g} g)`
  }
  if (i.measure === '100 g') return `${name} · ${Math.round(itemGrams(i))} g`
  const unit = i.measure.replace(/\s*\(\d+(\.\d+)? g\)$/, '')
  const m = unit.match(/^(\d+(?:\.\d+)?|½|¼)\s+(.*)$/)
  if (!m) return i.qty === 1 ? `${name} · ${unit}` : `${name} · ${fmtQty(i.qty)} × ${unit}`
  const base = m[1] === '½' ? 0.5 : m[1] === '¼' ? 0.25 : Number(m[1])
  return `${name} · ${fmtQty(base * i.qty)} ${m[2]}`
}

export function fmtQty(n: number): string {
  if (n === 0.25) return '¼'
  if (n === 0.5) return '½'
  if (Number.isInteger(n)) return String(n)
  if (n === Math.floor(n) + 0.5) return `${Math.floor(n)}½`
  return String(Math.round(n * 10) / 10)
}
