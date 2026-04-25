import { supabase } from '@/lib/supabase/client'

export async function getCurrentClient() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Find by auth_user_id
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (client) return client

  // Fallback — find by email
  const { data: clientByEmail } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  if (clientByEmail) {
    // Link auth_user_id
    await supabase
      .from('clients')
      .update({ auth_user_id: user.id })
      .eq('id', clientByEmail.id)

    return clientByEmail
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