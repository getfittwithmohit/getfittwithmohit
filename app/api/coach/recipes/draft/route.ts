import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { admin, loadFoods } from '@/lib/nutrition/ai'
import { draftRecipes } from '@/lib/nutrition/recipeAi'
import { MEAL_TYPES, PROTEIN_KEYS, type MealType, type ProteinKey } from '@/lib/nutrition/recipes'

// Coach only: draft a batch of recipes. They are saved as drafts — nothing
// reaches a client until the coach approves each one.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json().catch(() => ({}))
    const count = Math.min(10, Math.max(1, Math.round(Number(body.count) || 10)))
    const proteins = ((body.proteins || []) as string[]).filter((p): p is ProteinKey => (PROTEIN_KEYS as readonly string[]).includes(p))
    const meals = ((body.meals || []) as string[]).filter((m): m is MealType => (MEAL_TYPES as readonly string[]).includes(m))

    const [foods, existing] = await Promise.all([
      loadFoods(),
      admin.from('recipes').select('title').neq('status', 'rejected'),
    ])
    if (existing.error) {
      if (existing.error.code === '42P01' || existing.error.code === 'PGRST205') {
        return NextResponse.json({ error: 'Recipes aren’t set up yet. Run supabase/recipes.sql in Supabase.' }, { status: 400 })
      }
      throw new Error(existing.error.message)
    }

    const drafts = await draftRecipes({
      foods, count, proteins, meals,
      notes: String(body.notes || ''),
      existingTitles: (existing.data || []).map((r) => r.title as string),
    })
    if (!drafts.length) return NextResponse.json({ error: 'No recipes came back. Please try again.' }, { status: 502 })

    const { data, error } = await admin.from('recipes').insert(drafts.map((d) => ({ ...d, status: 'draft' }))).select('*')
    if (error) throw new Error(error.message)
    return NextResponse.json({ recipes: data })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('recipe draft error', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
