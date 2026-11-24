'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { clearCache } from '@/lib/ui/cache'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

// Returns the session, null if the user is genuinely logged out, or
// 'offline' if Supabase couldn't be reached (e.g. phone just woke up and
// the network isn't ready). A network hiccup must never count as a logout:
// supabase-js keeps the saved session in that case, so we just try again.
async function loadSession(): Promise<Session | null | 'offline'> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (session) return session
    if (!error) return null
    await wait(1000 * (attempt + 1))
  }
  return 'offline'
}

// Once a session has been confirmed in this tab, later screens open instantly
// (no full-screen spinner) while the check still runs quietly in the
// background. Signing out clears it.
let known: { isCoach: boolean } | null = null
let listening = false
const allowed = (role: 'coach' | 'any' | undefined, isCoach: boolean) =>
  role === 'any' || (role === 'coach' ? isCoach : !isCoach)

// role 'any': coach and clients may both use the page (e.g. PEAK Plate).
export function useAuthGuard(role?: 'coach' | 'any') {
  const [checking, setChecking] = useState(() => !(known && allowed(role, known.isCoach)))

  useEffect(() => {
    let cancelled = false
    if (!listening) {
      listening = true
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') { known = null; clearCache() }
      })
    }

    const run = async () => {
      let session = await loadSession()

      // Still can't reach the server: keep the saved login and retry
      // whenever the connection comes back, instead of logging out.
      while (session === 'offline' && !cancelled) {
        await Promise.race([
          wait(5000),
          new Promise(r => window.addEventListener('online', r, { once: true })),
        ])
        session = await loadSession()
      }
      if (cancelled || session === 'offline') return

      if (!session) {
        known = null
        window.location.href = '/login'
        return
      }

      const email = session.user.email?.toLowerCase()
      const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL?.toLowerCase()
      const isCoach = email === coachEmail
      known = { isCoach }

      if (role === 'coach' && !isCoach) {
        // Non-coach trying to access coach page
        window.location.href = '/home'
        return
      }

      if (role === 'any') {
        setChecking(false)
        return
      }

      if (!role && isCoach) {
        // Coach trying to access client page
        window.location.href = '/coach/dashboard'
        return
      }

      setChecking(false)
    }

    run()
    return () => { cancelled = true }
  }, [role])

  return { checking }
}
