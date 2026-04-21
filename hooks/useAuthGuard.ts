'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAuthGuard(redirectTo: string = '/login') {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = redirectTo
        return
      }
      setAuthenticated(true)
      setChecking(false)
    }
    check()
  }, [redirectTo])

  return { checking, authenticated }
}