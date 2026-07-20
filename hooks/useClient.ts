'use client'

import { useState, useEffect } from 'react'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { calcCurrentWeek } from '@/lib/supabase/queries/clients'

export type Client = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: string | null
  start_date: string | null
  current_week: number
  phase: string
  risk_status: string
  client_type: string
  auth_user_id: string | null
}

export function useClient() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getCurrentClient()
        if (data) {
          const liveWeek =
            data.phase === 'Onboarding' || !data.start_date
              ? data.current_week
              : calcCurrentWeek(data.start_date)
          setClient({ ...data, current_week: liveWeek })
        }
        setHasOnboarded(!!data)
      } catch (err) {
        console.error('useClient error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { client, loading, hasOnboarded }
}