import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'


// Use service role for backend operations (cron + backfill)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Calculate current week number from start_date
export function calcCurrentWeek(startDate: string | null): number {
  if (!startDate) return 1
  const start = new Date(startDate)
  const today = new Date()
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return Math.max(1, diff + 1)
}

// Mark a call's status + notes, with auto risk-flagging
export async function markReviewCall(
  clientId: string,
  weekNumber: number,
  fields: {
    status: 'completed' | 'missed' | 'rescheduled'
    discussed?: string
    changes?: string
    next_focus?: string
    call_date?: string
  }
) {
  const { error } = await supabase
    .from('review_calls')
    .upsert(
      {
        client_id: clientId,
        week_number: weekNumber,
        ...fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,week_number' }
    )

  if (error) throw error

  // existing risk auto-flagging logic stays exactly as-is below this
}

// Get all review calls for a client (for the profile tab)
export async function getReviewCallsForClient(clientId: string) {
  // Get the client's current week + program length
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('start_date, phase, current_week, program_duration_weeks')
    .eq('id', clientId)
    .single()

  if (clientError) throw clientError

  const rawWeek =
    client.phase === 'Onboarding' || !client.start_date
      ? client.current_week
      : calcCurrentWeek(client.start_date)

  const totalWeeks = Math.min(rawWeek, client.program_duration_weeks)

  // Get any real rows that exist
  const { data: existingCalls, error: callsError } = await supabase
    .from('review_calls')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true })

  if (callsError) throw callsError

  const callsByWeek = new Map(existingCalls.map(c => [c.week_number, c]))

  // Merge: real row if it exists, computed 'pending' if not
  const weeks = []
  for (let week = 1; week <= totalWeeks; week++) {
    if (callsByWeek.has(week)) {
      weeks.push(callsByWeek.get(week))
    } else {
      weeks.push({
        id: null,
        client_id: clientId,
        week_number: week,
        status: 'pending',
        discussed: null,
        changes: null,
        next_focus: null,
        call_date: null,
      })
    }
  }

  return weeks
}