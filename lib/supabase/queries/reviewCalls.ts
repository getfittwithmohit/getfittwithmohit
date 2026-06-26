import { createClient } from '@supabase/supabase-js'

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

// Backfill missing pending weeks for ONE client
export async function backfillReviewCallsForClient(clientId: string) {
  const supabase = getAdminClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, current_week, phase, program_duration_weeks')
    .eq('id', clientId)
    .single()

  if (!client || client.phase === 'Onboarding') return { created: 0 }

  // Use the STORED current_week — single source of truth
  const currentWeek = client.current_week || 1
  const maxWeek = Math.min(currentWeek, client.program_duration_weeks || 12)

  const { data: existing } = await supabase
    .from('review_calls')
    .select('week_number')
    .eq('client_id', clientId)

  const existingWeeks = new Set((existing || []).map((r) => r.week_number))

  const toInsert = []
  for (let w = 1; w <= maxWeek; w++) {
    if (!existingWeeks.has(w)) {
      toInsert.push({
        client_id: clientId,
        week_number: w,
        status: 'pending',
      })
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('review_calls').insert(toInsert)
  }

  return { created: toInsert.length }
}

// Backfill for ALL active clients — used by cron
export async function backfillReviewCallsForAllClients() {
  const supabase = getAdminClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, phase')
    .neq('phase', 'Onboarding')

  let totalCreated = 0
  for (const client of clients || []) {
    const result = await backfillReviewCallsForClient(client.id)
    totalCreated += result.created
  }

  return { clientsChecked: clients?.length || 0, totalCreated }
}

// Mark a call's status + notes, with auto risk-flagging
export async function markReviewCall(
  clientId: string,
  weekNumber: number,
  updates: {
    status: 'completed' | 'missed' | 'rescheduled' | 'pending'
    discussed?: string
    changes?: string
    next_focus?: string
    call_date?: string
  }
) {
  const supabase = getAdminClient()

  await supabase
    .from('review_calls')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)
    .eq('week_number', weekNumber)

  // Auto risk-flagging — check consecutive misses
  if (updates.status === 'missed' || updates.status === 'completed') {
    const { data: recentCalls } = await supabase
      .from('review_calls')
      .select('week_number, status')
      .eq('client_id', clientId)
      .order('week_number', { ascending: false })
      .limit(5)

    let consecutiveMissed = 0
    for (const call of recentCalls || []) {
      if (call.status === 'missed') consecutiveMissed++
      else if (call.status === 'completed') break
      else continue // skip pending/rescheduled in the streak count
    }

    let newRiskStatus: string | null = null
    if (consecutiveMissed >= 3) newRiskStatus = 'red'
    else if (consecutiveMissed === 2) newRiskStatus = 'amber'
    else if (updates.status === 'completed' && consecutiveMissed === 0) newRiskStatus = 'green'

    if (newRiskStatus) {
      await supabase
        .from('clients')
        .update({ risk_status: newRiskStatus })
        .eq('id', clientId)
    }
  }

  return { success: true }
}

// Get all review calls for a client (for the profile tab)
export async function getReviewCallsForClient(clientId: string) {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('review_calls')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true })
  return data || []
}