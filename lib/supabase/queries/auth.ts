import { supabase } from '@/lib/supabase/client'

// Get the currently logged in client's full record
export async function getCurrentClient() {
  // 1. Get auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // 2. Find their client record by auth_user_id
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error || !client) {
    // Try finding by email as fallback
    const { data: clientByEmail } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (clientByEmail) {
      // Link auth_user_id now that we found them
      await supabase
        .from('clients')
        .update({ auth_user_id: user.id })
        .eq('id', clientByEmail.id)

      return clientByEmail
    }

    return null
  }

  return client
}

// Check if current user is the coach
export async function isCoach() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL
  return user.email?.toLowerCase() === coachEmail?.toLowerCase()
}

// Get current auth user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}