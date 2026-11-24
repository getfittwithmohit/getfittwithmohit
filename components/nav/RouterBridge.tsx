'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setRouter } from '@/lib/ui/navigate'

// Gives lib/ui/navigate the app router so buttons navigate in-app.
export function RouterBridge() {
  const router = useRouter()
  useEffect(() => { setRouter(router) }, [router])
  return null
}
