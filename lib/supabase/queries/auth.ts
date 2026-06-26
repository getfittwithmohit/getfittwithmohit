import { supabase } from '@/lib/supabase/client'

function calcLiveWeek(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )
  return Math.max(1, diff + 1)
}

async function refreshCurrentWeek(client: any) {
  // Only auto-correct active programme phases, never Onboarding
  if (!client?.start_date || client.phase === 'Onboarding') return client

  const liveWeek = calcLiveWeek(client.start_date)
  if (liveWeek !== client.current_week) {
    await supabase
      .from('clients')
      .update({ current_week: liveWeek })
      .eq('id', client.id)
    return { ...client, current_week: liveWeek }
  }
  return client
}

export async function getCurrentClient() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (client) return await refreshCurrentWeek(client)

  const { data: clientByEmail } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  if (clientByEmail) {
    await supabase
      .from('clients')
      .update({ auth_user_id: user.id })
      .eq('id', clientByEmail.id)

    return await refreshCurrentWeek(clientByEmail)
  }

  return null
}

export async function isCoach() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL
  return user.email?.toLowerCase() === coachEmail?.toLowerCase()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}