import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcCurrentWeek } from '@/lib/supabase/queries/clients'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data: clients, error: clientsErr } = await supabaseAdmin
  .from('clients')
  .select('id, start_date, phase, current_week, program_duration_weeks')
  .neq('phase', 'Onboarding')

    if (clientsErr) throw clientsErr

    const result: Record<string, {
      week: number
      status: string
      discussed: string
      changes: string
      next_focus: string
    }> = {}

    for (const client of clients || []) {
  const rawWeek = !client.start_date
    ? client.current_week
    : calcCurrentWeek(client.start_date)
  const liveWeek = Math.min(rawWeek, client.program_duration_weeks || 12)
  if (!liveWeek) continue

      const { data: call } = await supabaseAdmin
        .from('review_calls')
        .select('status, discussed, changes, next_focus')
        .eq('client_id', client.id)
        .eq('week_number', liveWeek)
        .maybeSingle()

      result[client.id] = {
        week: liveWeek,
        status: call?.status || 'pending',
        discussed: call?.discussed || '',
        changes: call?.changes || '',
        next_focus: call?.next_focus || '',
      }
    }

    return NextResponse.json({ current: result })
  } catch (err: any) {
    console.error('Current status fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}