'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAuthGuard(role?: 'coach') {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login'
        return
      }

      const email = session.user.email?.toLowerCase()
      const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL?.toLowerCase()
      const isCoach = email === coachEmail

      if (role === 'coach' && !isCoach) {
        // Non-coach trying to access coach page
        window.location.href = '/home'
        return
      }

      if (!role && isCoach) {
        // Coach trying to access client page
        window.location.href = '/coach/dashboard'
        return
      }

      setChecking(false)
    })
  }, [role])

  return { checking }
}