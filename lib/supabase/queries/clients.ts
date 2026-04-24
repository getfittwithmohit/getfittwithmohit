import { supabase } from '@/lib/supabase/client'

// Fetch all clients with their latest metrics
export async function getAllClients() {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      full_name,
      email,
      phone,
      gender,
      city,
      start_date,
      current_week,
      phase,
      risk_status,
      client_type,
      status,
      coach_notes,
      created_at,
      body_metrics (
        weight_kg,
        target_weight_kg,
        primary_goal,
        recorded_at
      ),
      weekly_checkins (
        id,
        submitted_at,
        weight_kg,
        workouts_completed,
        nutrition_adherence,
        energy_level,
        mood,
        week_number
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Fetch single client full profile
export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      body_metrics (*),
      medical_history (*),
      fitness_background (*),
      lifestyle (*),
      nutrition (*),
      psychology (*),
      expectations (*),
      weekly_checkins (
        id,
        week_number,
        submitted_at,
        weight_kg,
        energy_level,
        mood,
        nutrition_adherence,
        workouts_completed,
        stress_level,
        coach_notes
      ),
      retention_alerts (
        id,
        alert_type,
        alert_message,
        resolved,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Update client risk status
export async function updateClientRisk(
  id: string,
  risk_status: 'green' | 'amber' | 'red'
) {
  const { error } = await supabase
    .from('clients')
    .update({ risk_status })
    .eq('id', id)

  if (error) throw error
}

// Update coach notes
export async function updateCoachNotes(id: string, notes: string) {
  const { error } = await supabase
    .from('clients')
    .update({ coach_notes: notes })
    .eq('id', id)

  if (error) throw error
}

// Add new client manually from dashboard
export async function addClient(payload: {
  full_name: string
  phone?: string
  email?: string
  phase: string
  client_type: string
  start_date: string
}) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...payload,
      current_week: 1,
      risk_status: 'green',
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Calculate week number from start date
export function calcCurrentWeek(startDate: string): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const today = new Date()
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )
  // Week 0 = onboarding, Week 1+ = programme
  return Math.max(0, diff)
}

export async function updateClientPhase(
  id: string,
  phase: string,
  programmeStartDate?: string
) {
  const updates: any = { phase }

  // When moving from Onboarding to Adaptation — set programme start date
  if (phase === 'Adaptation' && programmeStartDate) {
    updates.start_date = programmeStartDate
    updates.current_week = 1
  }

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

// Get retention alert message
export function getRetentionAlert(
  week: number,
  lastCheckin: string | null,
  risk: string
): { message: string; level: 'red' | 'amber' | 'green' } | null {
  // Missed check-in for 7+ days
  if (lastCheckin) {
    const last = new Date(lastCheckin)
    const today = new Date()
    const daysSince = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince >= 7) {
      return {
        message: `No check-in for ${daysSince} days — immediate re-engagement needed`,
        level: 'red',
      }
    }
  }

  // Week 3 dropout risk
  if (week === 3) {
    return {
      message: 'Week 3 dropout risk — most clients disengage here. Check in proactively.',
      level: 'amber',
    }
  }

  // Week 7 plateau risk
  if (week === 7) {
    return {
      message: 'Week 7 plateau risk — results may be slowing. Review programme and re-motivate.',
      level: 'amber',
    }
  }

  // Manual red flag
  if (risk === 'red') {
    return {
      message: 'Manually flagged as at-risk — follow up required.',
      level: 'red',
    }
  }

  return null
}

// Fetch client progress — all checkins + identity + pledge status
export async function getClientProgress(clientId: string) {
  const [checkinsRes, identityRes, pledgeRes, clientRes] = await Promise.all([
    supabase
      .from('weekly_checkins')
      .select('*')
      .eq('client_id', clientId)
      .order('week_number', { ascending: true }),

    supabase
      .from('identity_cards')
      .select('id, created_at')
      .eq('client_id', clientId)
      .single(),

    supabase
      .from('commitment_pledges')
      .select('id, signed_at, doing_this_for')
      .eq('client_id', clientId)
      .single(),

    supabase
      .from('clients')
      .select('*, body_metrics(*)')
      .eq('id', clientId)
      .single(),
  ])

  return {
    client: clientRes.data,
    checkins: checkinsRes.data || [],
    identity: identityRes.data || null,
    pledge: pledgeRes.data || null,
  }
}

// Check this week's checkin status
export function getThisWeekCheckinStatus(
  checkins: any[],
  currentWeek: number
): 'submitted' | 'pending' {
  const thisWeek = checkins.find((c) => c.week_number === currentWeek)
  return thisWeek ? 'submitted' : 'pending'
}

// Calculate check-in streak
export function calcCheckinStreak(checkins: any[]): number {
  if (!checkins.length) return 0
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  let streak = 0
  let expected = sorted[0].week_number
  for (const c of sorted) {
    if (c.week_number === expected) {
      streak++
      expected--
    } else {
      break
    }
  }
  return streak
}

// Calculate workout streak (weeks where workouts_completed >= 3)
export function calcWorkoutStreak(checkins: any[]): number {
  if (!checkins.length) return 0
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  let streak = 0
  let expected = sorted[0].week_number
  for (const c of sorted) {
    if (c.week_number === expected && (c.workouts_completed || 0) >= 3) {
      streak++
      expected--
    } else {
      break
    }
  }
  return streak
}

// Calculate total weight lost and measurements lost
export function calcTransformation(client: any, checkins: any[]) {
  const startWeight = client?.body_metrics?.[0]?.weight_kg || null
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  const latest = sorted[0] || null

  const currentWeight = latest?.weight_kg || null
  const weightLost = startWeight && currentWeight
    ? parseFloat((startWeight - currentWeight).toFixed(1))
    : null

  // Best week — highest week rating
  const bestWeek = checkins.reduce((best, c) => {
    if (!best || (c.week_rating || 0) > (best.week_rating || 0)) return c
    return best
  }, null)

  // Personal bests
  const maxEnergy = Math.max(...checkins.map((c) => c.energy_level || 0))
  const maxSteps = Math.max(...checkins.map((c) => c.daily_steps || 0))

  return { startWeight, currentWeight, weightLost, bestWeek, maxEnergy, maxSteps }
}