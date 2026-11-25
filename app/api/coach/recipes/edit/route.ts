import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { loadFoods } from '@/lib/nutrition/ai'
import { editRecipe } from '@/lib/nutrition/recipeAi'
import type { Recipe } from '@/lib/nutrition/recipes'

// Coach only: change a recipe from a plain-language instruction. Returns the
// proposal; nothing is saved until the coach taps Apply.
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json()
    const recipe = body.recipe as Recipe
    const instruction = String(body.instruction || '').trim()
    if (!recipe?.ingredients) return NextResponse.json({ error: 'Missing recipe' }, { status: 400 })
    if (!instruction) return NextResponse.json({ error: 'Type what to change.' }, { status: 400 })
    const foods = await loadFoods()
    return NextResponse.json(await editRecipe({ foods, recipe, instruction }))
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('recipe edit error', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
