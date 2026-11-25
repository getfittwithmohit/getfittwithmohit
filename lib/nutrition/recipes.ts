// Recipes — types and math. Pure functions, no network.
// A recipe is stored for ONE client portion. Everything the client sees
// (macros, swapped grams, family-pot amounts) is calculated here from the food
// library, never typed in by hand or guessed by AI.

import { nutrientsFor, type Food, type Nutrients } from './foods'

export const PROTEIN_KEYS = ['paneer', 'egg', 'chicken', 'fish', 'dal', 'soya', 'tofu', 'curd'] as const
export type ProteinKey = (typeof PROTEIN_KEYS)[number]
export const PROTEIN_LABEL: Record<ProteinKey, string> = {
  paneer: 'Paneer', egg: 'Eggs', chicken: 'Chicken', fish: 'Fish', dal: 'Dal & legumes', soya: 'Soya', tofu: 'Tofu', curd: 'Curd & whey',
}

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const RECIPE_TAGS = ['weekday', 'sunday_prep', 'tiffin', 'no_cook'] as const
export const TAG_LABEL: Record<string, string> = { weekday: 'Weekday', sunday_prep: 'Sunday prep', tiffin: 'Tiffin-friendly', no_cook: 'No cooking' }

export type RecipeDiet = 'vegan' | 'veg' | 'egg' | 'nonveg'
export const DIET_LABEL: Record<RecipeDiet, string> = { vegan: 'Vegan', veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' }

export interface RecipeIngredient {
  food: string // foods.slug
  grams: number // for one portion
  prep?: string
  is_protein?: boolean
}

// Spices, herbs and salt: listed for the cook, not counted in macros.
export interface RecipeExtra {
  name: string
  amount: string // per portion, e.g. "¼ tsp", "to taste"
}

export interface RecipeStep {
  text: string
  minutes?: number | null
}

export interface RecipeSwap {
  food: string
  note?: string
}

export interface Recipe {
  id: string
  title: string
  protein_key: ProteinKey
  meal_types: MealType[]
  diet: RecipeDiet
  jain_ok: boolean
  minutes: number
  equipment: string[]
  tags: string[]
  portion_label: string | null
  ingredients: RecipeIngredient[]
  extras: RecipeExtra[]
  steps: RecipeStep[]
  tip: string | null
  swaps: RecipeSwap[]
  dish_food: string | null
  status: 'draft' | 'approved' | 'rejected'
  source?: 'coach' | 'autopilot'
  review?: RecipeReview | null
  likes?: number
  dislikes?: number
  ai_model?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}

// The AI reviewer's verdict on an Autopilot recipe
export interface RecipeReview {
  verdict: 'publish' | 'needs_coach'
  reason: string
  notes?: string[]
}

const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
const add = (a: Nutrients, b: Nutrients): Nutrients => ({
  kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fibre: a.fibre + b.fibre,
})

// Macros for one portion. Unknown foods count as zero (and are flagged by checks).
export function portionTotals(ingredients: RecipeIngredient[], bySlug: Map<string, Food>): Nutrients {
  return ingredients.reduce((sum, i) => {
    const f = bySlug.get(i.food)
    return f ? add(sum, nutrientsFor(f, i.grams)) : sum
  }, ZERO)
}

export const mainProtein = (r: Pick<Recipe, 'ingredients'>) => r.ingredients.find((i) => i.is_protein) || null

// Round swap weights the way people measure: eggs by the egg, the rest by 5 g.
function roundGrams(food: Food, grams: number): number {
  const egg = food.measures.find((m) => /\begg\b/i.test(m.label) && m.grams > 30 && m.grams < 70)
  if (egg) return Math.max(1, Math.round(grams / egg.grams)) * egg.grams
  return Math.max(5, Math.round(grams / 5) * 5)
}

// Grams of `swap` that give the same protein as the recipe's main protein.
export function swapGrams(r: Pick<Recipe, 'ingredients'>, swap: Food, bySlug: Map<string, Food>): number | null {
  const main = mainProtein(r)
  const mainFood = main && bySlug.get(main.food)
  if (!main || !mainFood || swap.protein_g <= 0) return null
  const protein = (mainFood.protein_g * main.grams) / 100
  return roundGrams(swap, (protein / swap.protein_g) * 100)
}

// The ingredient list with the main protein replaced by `swapSlug`.
export function applySwap(r: Pick<Recipe, 'ingredients'>, swapSlug: string, bySlug: Map<string, Food>): RecipeIngredient[] {
  const swap = bySlug.get(swapSlug)
  const grams = swap ? swapGrams(r, swap, bySlug) : null
  if (!swap || grams === null) return r.ingredients
  return r.ingredients.map((i) => (i.is_protein ? { ...i, food: swapSlug, grams } : i))
}

// Diet and Jain flag follow from the ingredients, so they can never be wrong.
export function dietOf(ingredients: RecipeIngredient[], bySlug: Map<string, Food>): { diet: RecipeDiet; jain_ok: boolean } {
  const foods = ingredients.map((i) => bySlug.get(i.food)).filter(Boolean) as Food[]
  const diet: RecipeDiet = foods.some((f) => f.diet === 'nonveg') ? 'nonveg'
    : foods.some((f) => f.diet === 'egg') ? 'egg'
      : foods.length && foods.every((f) => f.is_vegan) ? 'vegan' : 'veg'
  return { diet, jain_ok: foods.length > 0 && foods.every((f) => f.is_jain_ok) }
}

// Family pot: one portion × people, in kitchen-friendly numbers.
export function potAmount(food: Food | undefined, gramsPerPortion: number, people: number): string {
  const g = gramsPerPortion * people
  if (food) {
    const egg = food.measures.find((m) => /\begg\b/i.test(m.label) && m.grams > 30 && m.grams < 70)
    if (egg) {
      const n = Math.round(g / egg.grams)
      const unit = egg.label.replace(/^[\d½¼¾.\s]+/, '') // "egg" or "egg white"
      return `${n} ${n === 1 ? unit : `${unit}s`}`
    }
    if (food.category === 'fats') {
      const tsp = Math.round(g / 5 * 2) / 2
      return `${fmtNum(tsp)} tsp`
    }
  }
  if (g >= 1000) return `${fmtNum(Math.round(g / 100) / 10)} kg`
  return `${Math.round(g)} g`
}

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''))

export interface RecipeCheck {
  ok: boolean
  label: string
  value: string
}

// What the coach sees before approving.
export function recipeChecks(r: Recipe, bySlug: Map<string, Food>): RecipeCheck[] {
  const t = portionTotals(r.ingredients, bySlug)
  const snackOnly = r.meal_types.length > 0 && r.meal_types.every((m) => m === 'snack')
  const minP = snackOnly ? 10 : 20
  const oil = r.ingredients.reduce((s, i) => (bySlug.get(i.food)?.category === 'fats' ? s + i.grams : s), 0)
  const missing = r.ingredients.filter((i) => !bySlug.has(i.food)).map((i) => i.food)
  const weekday = !r.tags.includes('sunday_prep')
  const checks: RecipeCheck[] = [
    { ok: t.protein >= minP, label: `Protein ≥ ${minP} g per portion`, value: `${Math.round(t.protein)} g` },
    { ok: !weekday || r.minutes <= 20, label: weekday ? 'Weekday ≤ 20 min' : 'Sunday prep', value: `${r.minutes} min` },
    { ok: oil <= 5.5, label: 'Oil/ghee ≤ 1 tsp per portion', value: `${fmtNum(Math.round(oil / 5 * 2) / 2)} tsp` },
    { ok: !!mainProtein(r), label: 'Main protein marked', value: mainProtein(r) ? (bySlug.get(mainProtein(r)!.food)?.name || '?') : 'none' },
    { ok: r.steps.length >= 3 && r.steps.length <= 8, label: '3–8 clear steps', value: String(r.steps.length) },
  ]
  if (missing.length) checks.unshift({ ok: false, label: 'Foods not in library', value: missing.join(', ') })
  return checks
}

export const emptyRecipe = (): Omit<Recipe, 'id'> => ({
  title: '', protein_key: 'paneer', meal_types: ['lunch'], diet: 'veg', jain_ok: false, minutes: 20,
  equipment: [], tags: ['weekday'], portion_label: null, ingredients: [], extras: [], steps: [], tip: null, swaps: [],
  dish_food: null, status: 'draft',
})

// ── Client side helpers ─────────────────────────────────────────────────────

// Does a food fit the client's diet (onboarding wording: Vegetarian,
// Eggetarian, Non-vegetarian, Jain, Vegan)? Unknown diet: everything fits.
export function fitsDiet(food: Pick<Food, 'diet' | 'is_vegan' | 'is_jain_ok'>, diet: string | null): boolean {
  const d = (diet || '').toLowerCase()
  if (!d) return true
  if (d.includes('vegan')) return food.is_vegan
  if (d.includes('jain')) return food.is_jain_ok
  if (d.includes('egg')) return food.diet !== 'nonveg'
  if (d.includes('non')) return true
  if (d.includes('veg')) return food.diet === 'veg'
  return true
}

export type ShareLang = 'en' | 'hi' | 'mr'

export interface RecipeTranslation {
  at: string // the recipe's updated_at it was made from
  title: string
  names: Record<string, string> // food slug → name
  extras: RecipeExtra[]
  steps: string[]
  tip: string
}

const LABELS: Record<ShareLang, { forN: (n: number) => string; ing: string; method: string; tip: string; sign: string }> = {
  en: { forN: (n) => `for ${n} ${n === 1 ? 'person' : 'people'}`, ing: 'Ingredients', method: 'Method', tip: 'Coach tip', sign: 'GFM 1:1 · Coach Mohit' },
  hi: { forN: (n) => `${n} ${n === 1 ? 'व्यक्ति' : 'लोगों'} के लिए`, ing: 'सामग्री', method: 'बनाने का तरीका', tip: 'कोच की सलाह', sign: 'GFM 1:1 · कोच मोहित' },
  mr: { forN: (n) => `${n} ${n === 1 ? 'व्यक्तीसाठी' : 'जणांसाठी'}`, ing: 'साहित्य', method: 'कृती', tip: 'कोचचा सल्ला', sign: 'GFM 1:1 · कोच मोहित' },
}

// Units in amounts made by potAmount ("480 g", "4 tsp", "6 eggs", "1.2 kg").
const UNITS: Record<Exclude<ShareLang, 'en'>, [RegExp, string][]> = {
  hi: [[/\begg whites?\b/, 'अंडे की सफ़ेदी'], [/\beggs?\b/, 'अंडे'], [/\bkg\b/, 'किलो'], [/\btsp\b/, 'छोटे चम्मच'], [/\bg\b/, 'ग्राम']],
  mr: [[/\begg whites?\b/, 'अंड्याचा पांढरा भाग'], [/\beggs?\b/, 'अंडी'], [/\bkg\b/, 'किलो'], [/\btsp\b/, 'छोटे चमचे'], [/\bg\b/, 'ग्रॅम']],
}

export function localizeAmount(amount: string, lang: ShareLang): string {
  if (lang === 'en') return amount
  return UNITS[lang].reduce((s, [re, to]) => s.replace(re, to), amount)
}

// The WhatsApp message for whoever is cooking: family-pot amounts, steps, tip.
export function shareText(args: {
  lang: ShareLang
  title: string
  people: number
  ingredients: { name: string; amount: string; prep?: string }[]
  extras: RecipeExtra[]
  steps: string[]
  tip: string | null
}): string {
  const L = LABELS[args.lang]
  const lines = [
    `*${args.title}* — ${L.forN(args.people)}`,
    '',
    `*${L.ing}*`,
    ...args.ingredients.map((i) => `• ${i.name}${i.prep ? ` (${i.prep})` : ''}: ${localizeAmount(i.amount, args.lang)}`),
    ...args.extras.map((x) => `• ${x.name}: ${x.amount}`),
    '',
    `*${L.method}*`,
    ...args.steps.map((s, i) => `${i + 1}. ${s}`),
  ]
  if (args.tip) lines.push('', `*${L.tip}:* ${args.tip}`)
  lines.push('', `_${L.sign}_`)
  return lines.join('\n')
}

// Extras are written for one portion; for the pot, keep them as written when
// they're "to taste"-style, otherwise say "per person".
export function potExtra(x: RecipeExtra, people: number, lang: ShareLang = 'en'): RecipeExtra {
  if (people === 1 || !/\d|½|¼|¾/.test(x.amount)) return x
  const per = lang === 'hi' ? 'प्रति व्यक्ति' : lang === 'mr' ? 'प्रत्येकी' : 'per person'
  return { ...x, amount: `${x.amount} ${per}` }
}
