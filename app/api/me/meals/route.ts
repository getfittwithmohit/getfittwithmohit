import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { admin } from '@/lib/nutrition/ai'
import { optionTotals, type PlanDoc } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'

// The signed-in client's meal ticks for a day (GET), tick a meal (POST),
// or undo a tick (DELETE). Ticks are checked against the published plan and
// protein is worked out here, so the coach's view can trust the numbers.

const COLS = 'tick_date, meal_id, meal_name, status, option_id, option_title, protein_g, kcal, plate_log_id'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const tickSchema = z.object({
  date: dateSchema,
  meal_id: z.string().min(1).max(80),
  status: z.enum(['ate', 'else', 'skipped']),
  option_id: z.string().max(80).nullish(),
  plate_log_id: z.string().uuid().nullish(),
})

async function me() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: client } = await admin.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
  return client ? { userId: user.id, clientId: client.id as string } : null
}

// Today, or yesterday for a late catch-up. Nothing older or in the future.
function allowedDate(d: string) {
  const today = todayIST()
  return d === today || d === addDaysIST(today, -1)
}

export async function GET(req: NextRequest) {
  const who = await me()
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date') || todayIST()
  if (!dateSchema.safeParse(date).success) return NextResponse.json({ error: 'Bad date' }, { status: 400 })
  const { data, error } = await admin.from('meal_ticks').select(COLS).eq('client_id', who.clientId).eq('tick_date', date)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ date, ticks: data || [] })
}

export async function POST(req: NextRequest) {
  const who = await me()
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const parsed = tickSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { date, meal_id, status, option_id, plate_log_id } = parsed.data
  if (!allowedDate(date)) return NextResponse.json({ error: 'You can only log today or yesterday' }, { status: 400 })

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('published, version')
    .eq('client_id', who.clientId)
    .eq('status', 'active')
    .not('published', 'is', null)
    .maybeSingle()
  const doc = plan?.published as PlanDoc | undefined
  const meal = doc?.meals.find((m) => m.id === meal_id)
  if (!doc || !meal) return NextResponse.json({ error: 'That meal isn’t on your plan any more' }, { status: 404 })

  let option_title: string | null = null
  let protein_g: number | null = null
  let kcal: number | null = null
  let optionId: string | null = null
  let plateId: string | null = null

  if (status === 'ate') {
    const option = meal.options.find((o) => o.id === option_id) || (meal.options.length === 1 ? meal.options[0] : undefined)
    if (!option) return NextResponse.json({ error: 'Pick which option you ate' }, { status: 400 })
    const slugs = [...new Set(option.items.map((i) => i.food))]
    const { data: foods } = await admin.from('foods').select('slug, name, kcal, protein_g, carbs_g, fat_g, fibre_g, measures').in('slug', slugs)
    const t = optionTotals(option, new Map((foods as Food[] | null || []).map((f) => [f.slug, f])))
    optionId = option.id
    option_title = option.title
    protein_g = Math.round(t.protein * 10) / 10
    kcal = Math.round(t.kcal)
  } else if (status === 'else' && plate_log_id) {
    // A PEAK Plate scan the client saved for this meal
    const { data: log } = await admin.from('meal_logs').select('id, title, protein_g, calories, logged').eq('id', plate_log_id).eq('user_id', who.userId).maybeSingle()
    if (!log?.logged) return NextResponse.json({ error: 'That snap wasn’t saved' }, { status: 400 })
    plateId = log.id
    option_title = log.title
    protein_g = Number(log.protein_g)
    kcal = log.calories
  }

  const row = {
    client_id: who.clientId, tick_date: date, meal_id, meal_name: meal.name, status,
    option_id: optionId, option_title, protein_g, kcal, plate_log_id: plateId,
    plan_version: plan?.version ?? null, updated_at: new Date().toISOString(),
  }
  const { data, error } = await admin.from('meal_ticks').upsert(row, { onConflict: 'client_id,tick_date,meal_id' }).select(COLS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tick: data })
}

export async function DELETE(req: NextRequest) {
  const who = await me()
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date') || ''
  const meal = req.nextUrl.searchParams.get('meal_id') || ''
  if (!dateSchema.safeParse(date).success || !meal || !allowedDate(date)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { error } = await admin.from('meal_ticks').delete().eq('client_id', who.clientId).eq('tick_date', date).eq('meal_id', meal)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
