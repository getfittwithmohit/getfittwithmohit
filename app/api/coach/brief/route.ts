import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { calcCurrentWeek } from '@/lib/supabase/queries/clients'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'
import { buildFacts } from '@/lib/brief/facts'
import { writeBrief } from '@/lib/brief/write'

// Coach-only: gather a client's last two weeks, compute the facts, and have
// Claude write the pre-call brief. Nothing is stored.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const { clientId } = await req.json()
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const today = todayIST()
    const from14 = addDaysIST(today, -14)
    const db = supabaseAdmin

    const { data: client, error: clientErr } = await db.from('clients').select('*').eq('id', clientId).maybeSingle()
    if (clientErr) throw clientErr
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // Every section is optional: a failed read becomes an empty section.
    const rows = async (p: PromiseLike<{ data: unknown; error: unknown }>) => {
      const r = await p
      if (r.error) console.warn('Coach Brief read failed:', r.error)
      return (r.error ? [] : r.data || []) as Record<string, unknown>[]
    }
    const one = async (p: PromiseLike<{ data: unknown; error: unknown }>) => {
      const r = await p
      if (r.error) console.warn('Coach Brief read failed:', r.error)
      return (r.error ? null : r.data || null) as Record<string, unknown> | null
    }

    const [bodyMetrics, pledge, weekly, daily, workouts, painFlags, meals, rituals, ritualStreak, photos, calls] = await Promise.all([
      one(db.from('body_metrics').select('*').eq('client_id', clientId).order('recorded_at', { ascending: true }).limit(1).maybeSingle()),
      one(db.from('commitment_pledges').select('*').eq('client_id', clientId).limit(1).maybeSingle()),
      rows(db.from('weekly_checkins').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(12)),
      rows(db.from('daily_checkins').select('*').eq('client_id', clientId).gte('checkin_date', from14)),
      rows(db.from('workout_logs').select('*').eq('client_id', clientId).gte('started_at', `${from14}T00:00:00Z`)),
      rows(db.from('workout_pain_flags').select('*').eq('client_id', clientId).eq('resolved', false)),
      rows(db.from('meal_logs').select('meal_date, calories, protein_g, score, verdict, title').eq('client_id', clientId).eq('logged', true).gte('meal_date', from14)),
      rows(db.from('daily_rituals').select('*').eq('client_id', clientId).gte('date', from14)),
      one(db.from('ritual_streaks').select('*').eq('client_id', clientId).maybeSingle()),
      rows(db.from('progress_photos').select('week_number').eq('client_id', clientId)),
      rows(db.from('review_calls').select('*').eq('client_id', clientId).order('week_number', { ascending: false }).limit(4)),
    ])

    const currentWeek =
      client.phase === 'Onboarding' || !client.start_date ? client.current_week || 1 : calcCurrentWeek(client.start_date)
    const lastCall = calls.find((c) => c.discussed || c.changes || c.next_focus) || null

    const facts = buildFacts({
      today,
      currentWeek,
      client,
      bodyMetrics,
      pledge,
      weekly,
      daily,
      workouts,
      painFlags,
      meals,
      rituals,
      ritualStreak,
      photoWeeks: photos.map((p) => Number(p.week_number) || 1),
      lastCall,
    })

    const brief = await writeBrief(facts)
    return NextResponse.json({ brief, facts, generatedAt: new Date().toISOString() })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('Coach Brief error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Could not write the brief' }, { status: 500 })
  }
}
