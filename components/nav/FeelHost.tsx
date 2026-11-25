'use client'

import { useEffect } from 'react'
import { haptic } from '@/lib/ui/feel'

const TAPPABLE = 'button:not(:disabled), [role="checkbox"], [role="radio"], [role="tab"], a[href]'

// One app-wide listener: a light haptic tick on every button, chip and link
// press (Android). Nothing to wire per screen.
export function FeelHost() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null
      if (el?.closest?.(TAPPABLE)) haptic('tap')
    }
    document.addEventListener('click', onClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
  return null
}
