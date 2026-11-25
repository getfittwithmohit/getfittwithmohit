import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { admin } from '@/lib/nutrition/ai'

// "Would you cook this again?" — one vote per client per recipe (changeable).
// Recipe Autopilot rewrites live recipes that clients keep saying no to.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const { data: client } = await admin.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
  if (!client) return NextResponse.json({ ok: true }) // coach previewing: nothing to record

  const { id, liked } = await req.json()
  const { data: recipe } = await admin.from('recipes').select('id').eq('id', String(id)).eq('status', 'approved').maybeSingle()
  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

  const { error } = await admin.from('recipe_feedback').upsert({ recipe_id: recipe.id, client_id: client.id, liked: !!liked, created_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: votes } = await admin.from('recipe_feedback').select('liked').eq('recipe_id', recipe.id)
  const likes = (votes || []).filter((v) => v.liked).length
  await admin.from('recipes').update({ likes, dislikes: (votes || []).length - likes }).eq('id', recipe.id)
  return NextResponse.json({ ok: true })
}
