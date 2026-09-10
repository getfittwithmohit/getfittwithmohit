import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function authErrorResponse(err: AuthError) {
  return NextResponse.json({ error: err.message }, { status: err.status })
}

async function getSessionUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function isCoach(email: string | null | undefined): boolean {
  const coachEmail = process.env.COACH_EMAIL?.toLowerCase()
  return !!email && !!coachEmail && email.toLowerCase() === coachEmail
}

// Throws AuthError if the current session isn't the coach.
export async function requireCoach(): Promise<void> {
  const user = await getSessionUser()
  if (!isCoach(user?.email)) {
    throw new AuthError('Coach authentication required', 401)
  }
}

// Throws AuthError unless the current session is the coach, or is the
// client whose id is `clientId`. Returns whether the caller is the coach,
// in case a route needs to branch on it.
export async function requireOwnClientOrCoach(clientId: string): Promise<{ isCoach: boolean }> {
  const user = await getSessionUser()
  if (isCoach(user?.email)) return { isCoach: true }

  if (!user) {
    throw new AuthError('Authentication required', 401)
  }

  const supabase = await createServerClient()
  const { data: ownClient } = await supabase
    .from('clients')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('id', clientId)
    .maybeSingle()

  if (!ownClient) {
    throw new AuthError('Not authorized for this client', 403)
  }

  return { isCoach: false }
}
