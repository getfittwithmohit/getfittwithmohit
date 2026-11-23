import { supabase } from '@/lib/supabase/client'
import { computeRecipe, type Food } from '@/lib/nutrition/foods'

// Food database (supabase/nutrition_foods.sql). Everyone signed in reads;
// only the coach writes (RLS).

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))

function normalise(row: Record<string, unknown>): Food {
  return {
    ...(row as unknown as Food),
    kcal: num(row.kcal),
    protein_g: num(row.protein_g),
    carbs_g: num(row.carbs_g),
    fat_g: num(row.fat_g),
    fibre_g: num(row.fibre_g),
    recipe_yield_g: row.recipe_yield_g === null ? null : num(row.recipe_yield_g),
    allergens: (row.allergens as string[]) || [],
    measures: ((row.measures as Food['measures']) || []).map((m) => ({ ...m, grams: num(m.grams) })),
  }
}

export async function getFoods(): Promise<Food[]> {
  const { data, error } = await supabase.from('foods').select('*').order('name')
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Error('The food list isn’t set up yet. Run supabase/nutrition_foods.sql in Supabase.')
    }
    throw new Error(`Could not load foods: ${error.message}`)
  }
  return (data || []).map(normalise)
}

export type FoodInput = Omit<Food, 'id'>

const NUTRIENT_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g'] as const

// Saves one food. When an ingredient's values change, every dish that uses it
// is recalculated too, so no dish is left with stale numbers.
export async function saveFood(input: FoodInput, id: string | null, all: Food[]): Promise<{ saved: Food; updatedDishes: Food[] }> {
  const row = { ...input, name: input.name.trim(), local_name: input.local_name?.trim() || null, updated_at: new Date().toISOString() }
  const query = id
    ? supabase.from('foods').update(row).eq('id', id).select().single()
    : supabase.from('foods').insert(row).select().single()
  const { data, error } = await query
  if (error || !data) {
    if (error?.code === '23505') throw new Error(`A food with this name already exists. Give it a different name.`)
    throw new Error(`Could not save: ${error?.message || 'unknown error'}`)
  }
  const saved = normalise(data)

  const before = id ? all.find((f) => f.id === id) : null
  const changed = saved.kind === 'ingredient' && before &&
    (NUTRIENT_KEYS.some((k) => before[k] !== saved[k]) || before.verified !== saved.verified ||
      before.diet !== saved.diet || before.is_vegan !== saved.is_vegan || before.is_jain_ok !== saved.is_jain_ok ||
      before.is_fasting_ok !== saved.is_fasting_ok || before.allergens.join() !== saved.allergens.join())
  const updatedDishes: Food[] = []
  if (changed) {
    const bySlug = new Map(all.map((f) => [f.slug, f.id === saved.id ? saved : f]))
    for (const dish of all.filter((f) => f.kind === 'dish' && f.recipe?.some((r) => r.slug === saved.slug))) {
      const r = computeRecipe(dish.recipe || [], dish.recipe_yield_g || 0, bySlug)
      const { data: d } = await supabase.from('foods').update({
        ...r.per100, diet: r.diet, is_vegan: r.is_vegan, is_jain_ok: r.is_jain_ok,
        allergens: r.allergens, verified: r.verified, updated_at: new Date().toISOString(),
      }).eq('id', dish.id).select().single()
      if (d) updatedDishes.push(normalise(d))
    }
  }
  return { saved, updatedDishes }
}
