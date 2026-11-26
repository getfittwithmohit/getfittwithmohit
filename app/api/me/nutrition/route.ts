import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// The signed-in client's PUBLISHED nutrition plan, plus the foods it uses.
// Drafts never leave the server, so a half-finished edit can't reach the client.
const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: client } = await admin.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
  if (!client) return NextResponse.json({ plan: null })

  const { data: plan, error } = await admin
    .from('nutrition_plans')
    .select('name, published, version, published_at, change_note')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .not('published', 'is', null)
    .maybeSingle()
  if (error || !plan) return NextResponse.json({ plan: null })

  const slugs = [...new Set(
    (plan.published?.meals || []).flatMap((m: { options: { items: { food: string }[] }[] }) =>
      m.options.flatMap((o) => o.items.map((i) => i.food)))
  )]
  const { data: foods } = slugs.length
    ? await admin.from('foods').select('slug, name, local_name, kcal, protein_g, carbs_g, fat_g, fibre_g, measures, diet').in('slug', slugs)
    : { data: [] }

  // Approved recipes that teach a dish on this plan ("How to cook it").
  // One per dish: if several are linked, the clients' favourite (then the
  // first approved) wins.
  const { data: linked } = slugs.length
    ? await admin.from('recipes').select('id, title, dish_food, minutes, likes, dislikes, approved_at').eq('status', 'approved').in('dish_food', slugs)
    : { data: [] }
  const best = new Map<string, { id: string; title: string; dish_food: string; minutes: number }>()
  const score = (r: { likes?: number | null; dislikes?: number | null }) => (r.likes || 0) - (r.dislikes || 0)
  for (const r of [...(linked || [])].sort((a, b) => score(b) - score(a) || String(a.approved_at).localeCompare(String(b.approved_at)))) {
    if (!best.has(r.dish_food)) best.set(r.dish_food, { id: r.id, title: r.title, dish_food: r.dish_food, minutes: r.minutes })
  }
  const recipes = [...best.values()]

  return NextResponse.json({
    recipes,
    plan: { name: plan.name, doc: plan.published, version: plan.version, published_at: plan.published_at, change_note: plan.change_note },
    foods: foods || [],
  })
}
