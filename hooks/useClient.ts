'use client'

import { useState, useEffect } from 'react'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { calcCurrentWeek } from '@/lib/supabase/queries/clients'
import { getCached, setCached } from '@/lib/ui/cache'

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

type Cached = { client: Client | null; hasOnboarded: boolean }

// The signed-in client. After the first load in this tab it is returned
// instantly (and refreshed in the background), so screens don't wait for it.
export function useClient() {
  const [client, setClient] = useState<Client | null>(() => getCached<Cached>('client')?.client ?? null)
  const [loading, setLoading] = useState(() => !getCached<Cached>('client'))
  const [hasOnboarded, setHasOnboarded] = useState(() => getCached<Cached>('client')?.hasOnboarded ?? false)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getCurrentClient()
        let next: Client | null = null
        if (data) {
          const liveWeek =
            data.phase === 'Onboarding' || !data.start_date
              ? data.current_week
              : calcCurrentWeek(data.start_date)
          next = { ...data, current_week: liveWeek }
        }
        const prev = getCached<Cached>('client')
        // Keep the same object when nothing changed, so screens don't reload
        if (!prev || JSON.stringify(prev.client) !== JSON.stringify(next)) setClient(next)
        setCached<Cached>('client', { client: next, hasOnboarded: !!data })
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