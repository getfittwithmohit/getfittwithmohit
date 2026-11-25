import { supabase } from '@/lib/supabase/client'
import type { Recipe } from '@/lib/nutrition/recipes'

// Recipes (supabase/recipes.sql). Coach reads and writes everything; clients
// can only read approved recipes (RLS).

const notSetUp = (code?: string) => code === '42P01' || code === 'PGRST205'

function normalise(row: Record<string, unknown>): Recipe {
  return {
    ...(row as unknown as Recipe),
    meal_types: (row.meal_types as Recipe['meal_types']) || [],
    equipment: (row.equipment as string[]) || [],
    tags: (row.tags as string[]) || [],
    ingredients: ((row.ingredients as Recipe['ingredients']) || []).map((i) => ({ ...i, grams: Number(i.grams) || 0 })),
    extras: (row.extras as Recipe['extras']) || [],
    steps: (row.steps as Recipe['steps']) || [],
    swaps: (row.swaps as Recipe['swaps']) || [],
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
  if (error) {
    if (notSetUp(error.code)) throw new Error('Recipes aren’t set up yet. Run supabase/recipes.sql in Supabase.')
    throw new Error(`Could not load recipes: ${error.message}`)
  }
  return (data || []).map(normalise)
}

export type RecipePatch = Partial<Omit<Recipe, 'id' | 'created_at'>>

export async function updateRecipe(id: string, patch: RecipePatch): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`Could not save: ${error.message}`)
  return normalise(data)
}

export async function setRecipeStatus(id: string, status: Recipe['status']): Promise<Recipe> {
  return updateRecipe(id, { status, approved_at: status === 'approved' ? new Date().toISOString() : null })
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw new Error(`Could not delete: ${error.message}`)
}
