'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAuthGuard(role?: 'coach') {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // getSession is instant if session is cached
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login'
        return
      }

      // Coach guard
      if (role === 'coach') {
        const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL
        if (session.user.email?.toLowerCase() !== coachEmail?.toLowerCase()) {
          window.location.href = '/home'
          return
        }
      }

      setAuthenticated(true)
      setChecking(false)
    })
  }, [role])

  return { checking, authenticated }
}