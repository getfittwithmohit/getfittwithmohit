import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { admin } from '@/lib/nutrition/ai'

// Approved recipes for the signed-in user, with the foods needed to calculate
// them and the client's diet (so swaps only offer what fits).
//   GET /api/me/recipes          → the recipe book
//   GET /api/me/recipes?id=<id>  → one recipe
const FOOD_COLS = 'slug, name, local_name, category, kind, kcal, protein_g, carbs_g, fat_g, fibre_g, measures, diet, is_vegan, is_jain_ok, is_active'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: client } = await admin.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
  const { data: nutrition } = client
    ? await admin.from('nutrition').select('diet_preference').eq('client_id', client.id).maybeSingle()
    : { data: null }
  const diet = (nutrition?.diet_preference as string | null) ?? null

  const id = req.nextUrl.searchParams.get('id')
  let query = admin.from('recipes').select('*').eq('status', 'approved')
  if (id) query = query.eq('id', id)
  const { data: recipes, error } = await query.order('title')
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ recipes: [], foods: [], diet })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (id && !recipes?.length) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

  const slugs = [...new Set((recipes || []).flatMap((r) => [
    ...((r.ingredients || []) as { food: string }[]).map((i) => i.food),
    ...((r.swaps || []) as { food: string }[]).map((s) => s.food),
  ]))]
  const { data: foods } = slugs.length ? await admin.from('foods').select(FOOD_COLS).in('slug', slugs) : { data: [] }

  // Translations are fetched separately when needed
  const out = (recipes || []).map(({ translations: _t, ai_model: _m, ...r }) => { void _t; void _m; return r })
  return NextResponse.json({ recipes: out, foods: foods || [], diet })
}
