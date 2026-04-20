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
  const start = new Date(startDate)
  const today = new Date()
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )
  return Math.max(1, diff + 1)
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