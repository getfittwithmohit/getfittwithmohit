import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, requireOwnClientOrCoach, authErrorResponse } from '@/lib/supabase/serverAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { clientId, steps } = await req.json()
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }
    await requireOwnClientOrCoach(clientId)

    const today = new Date().toISOString().split('T')[0]

    // Save today's ritual
    await supabaseAdmin.from('daily_rituals').upsert({
      client_id: clientId,
      date: today,
      strangest_secret_done: steps.includes(1),
      goal_card_done: steps.includes(2),
      affirmations_done: steps.includes(3),
      goals_done: steps.includes(4),
      codex_done: steps.includes(5),
      completed_at: new Date().toISOString(),
    }, { onConflict: 'client_id,date' })

    // Calculate streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdayRitual } = await supabaseAdmin
      .from('daily_rituals')
      .select('completed_at')
      .eq('client_id', clientId)
      .eq('date', yesterdayStr)
      .maybeSingle()

    const { data: streak } = await supabaseAdmin
      .from('ritual_streaks')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    const currentStreak = yesterdayRitual ? (streak?.current_streak || 0) + 1 : 1
    const longestStreak = Math.max(currentStreak, streak?.longest_streak || 0)
    const totalCompletions = (streak?.total_completions || 0) + 1

    await supabaseAdmin.from('ritual_streaks').upsert({
      client_id: clientId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: today,
      total_completions: totalCompletions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })

    return NextResponse.json({ success: true, streak: currentStreak, longest: longestStreak })
  } catch (err: any) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('Ritual complete error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}