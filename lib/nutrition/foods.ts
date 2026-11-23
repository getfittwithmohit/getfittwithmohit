// Food database — types and the nutrition math used everywhere (food library,
// plan builder, client plan). Pure functions, no network.

export type Diet = 'veg' | 'egg' | 'nonveg'
export type FoodKind = 'ingredient' | 'dish'
export type FoodSource = 'ifct2017' | 'recipe' | 'label' | 'coach'

export interface Measure {
  label: string
  grams: number
  default?: boolean
}

export interface RecipeItem {
  slug: string
  grams: number
}

export interface Food {
  id: string
  slug: string
  name: string
  local_name: string | null
  category: string
  kind: FoodKind
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  diet: Diet
  is_vegan: boolean
  is_jain_ok: boolean
  is_fasting_ok: boolean
  allergens: string[]
  measures: Measure[]
  recipe: RecipeItem[] | null
  recipe_yield_g: number | null
  source: FoodSource
  source_ref: string | null
  verified: boolean
  notes: string | null
  is_active: boolean
}

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fibre: number
}

export const CATEGORIES = [
  'breakfast', 'breads', 'dals', 'curries', 'sabzi', 'rice', 'salads', 'snacks', 'drinks',
  'grains', 'legumes', 'dairy', 'eggs', 'meat', 'fish', 'vegetables', 'fruits', 'nuts', 'fats', 'sweeteners',
] as const

export const CATEGORY_LABEL: Record<string, string> = {
  breakfast: 'Breakfast', breads: 'Rotis & breads', dals: 'Dals', curries: 'Curries', sabzi: 'Sabzis',
  rice: 'Rice & grains', salads: 'Salads & soups', snacks: 'Snacks & sweets', drinks: 'Drinks',
  grains: 'Grains & flours', legumes: 'Dals & legumes (dry)', dairy: 'Dairy', eggs: 'Eggs', meat: 'Chicken & meat',
  fish: 'Fish & seafood', vegetables: 'Vegetables', fruits: 'Fruits', nuts: 'Nuts & seeds', fats: 'Oils & ghee',
  sweeteners: 'Sugar & sweeteners',
}

export const ALLERGENS = ['dairy', 'gluten', 'nuts', 'peanut', 'soy', 'egg', 'fish', 'shellfish', 'sesame'] as const

const r1 = (n: number) => Math.round(n * 10) / 10

// Energy from macros, the same rule as the seed: 4 kcal/g protein and carbs,
// 9 fat, 2 fibre.
export function kcalFrom(p: number, c: number, f: number, fib: number): number {
  return r1(4 * p + 4 * c + 9 * f + 2 * fib)
}

export function nutrientsFor(food: Pick<Food, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fibre_g'>, grams: number): Nutrients {
  const k = grams / 100
  return {
    kcal: food.kcal * k,
    protein: food.protein_g * k,
    carbs: food.carbs_g * k,
    fat: food.fat_g * k,
    fibre: food.fibre_g * k,
  }
}

export function defaultMeasure(food: Pick<Food, 'measures'>): Measure {
  return food.measures.find((m) => m.default) || food.measures.find((m) => m.label !== '100 g') || { label: '100 g', grams: 100 }
}

export interface RecipeResult {
  per100: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }
  total: Nutrients
  diet: Diet
  is_vegan: boolean
  is_jain_ok: boolean
  is_fasting_ok: boolean
  allergens: string[]
  verified: boolean
  missing: string[]
}

// A dish's values per 100 g cooked, its diet flags and allergens — all derived
// from its ingredients, so editing a recipe can never leave stale numbers.
export function computeRecipe(recipe: RecipeItem[], yieldG: number, bySlug: Map<string, Food>): RecipeResult {
  const parts = recipe
    .map((r) => ({ food: bySlug.get(r.slug), grams: r.grams }))
  const missing = parts.filter((p) => !p.food).map((_, i) => recipe[i].slug)
  const ok = parts.filter((p): p is { food: Food; grams: number } => !!p.food && p.grams > 0)
  const total = ok.reduce<Nutrients>((t, { food, grams }) => {
    const n = nutrientsFor(food, grams)
    return { kcal: t.kcal + n.kcal, protein: t.protein + n.protein, carbs: t.carbs + n.carbs, fat: t.fat + n.fat, fibre: t.fibre + n.fibre }
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
  const y = yieldG > 0 ? yieldG : 1
  const p = (total.protein / y) * 100, c = (total.carbs / y) * 100, f = (total.fat / y) * 100, fib = (total.fibre / y) * 100
  const diet: Diet = ok.some((x) => x.food.diet === 'nonveg') ? 'nonveg' : ok.some((x) => x.food.diet === 'egg') ? 'egg' : 'veg'
  return {
    per100: { kcal: kcalFrom(p, c, f, fib), protein_g: r1(p), carbs_g: r1(c), fat_g: r1(f), fibre_g: r1(fib) },
    total: { ...total, kcal: 4 * total.protein + 4 * total.carbs + 9 * total.fat + 2 * total.fibre },
    diet,
    is_vegan: ok.length > 0 && ok.every((x) => x.food.is_vegan),
    is_jain_ok: diet === 'veg' && ok.length > 0 && ok.every((x) => x.food.is_jain_ok),
    is_fasting_ok: ok.length > 0 && ok.every((x) => x.food.is_fasting_ok),
    allergens: [...new Set(ok.flatMap((x) => x.food.allergens))],
    verified: ok.length > 0 && ok.every((x) => x.food.verified),
    missing,
  }
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

export const SOURCE_LABEL: Record<FoodSource, string> = {
  ifct2017: 'IFCT 2017',
  recipe: 'Recipe',
  label: 'Label value',
  coach: 'Added by you',
}
