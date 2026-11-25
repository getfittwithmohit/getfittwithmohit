'use client'

import { useEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/ui/feel'

const TRIGGER = 72 // px of pull needed to refresh
const MAX = 110

// Pull down from the very top of the page to refresh. Only the small
// indicator moves — the page itself is never transformed, so fixed bars and
// sheets stay put.
export function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<unknown> }) {
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)
  const startY = useRef<number | null>(null)
  const armed = useRef(false)
  const pullRef = useRef(0)
  const busyRef = useRef(false)
  const refreshRef = useRef(onRefresh)
  useEffect(() => { refreshRef.current = onRefresh }, [onRefresh])

  useEffect(() => {
    const setP = (v: number) => { pullRef.current = v; setPull(v) }

    const onStart = (e: TouchEvent) => {
      if (busyRef.current || window.scrollY > 0 || e.touches.length !== 1) { startY.current = null; return }
      // Don't hijack pulls that start inside an open sheet or a scrollable box
      const t = e.target as Element | null
      if (t?.closest?.('[role="dialog"], [data-no-ptr]')) { startY.current = null; return }
      startY.current = e.touches[0].clientY
      armed.current = false
    }
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || window.scrollY > 0) { if (pullRef.current) setP(0); return }
      // Resistance: the further you pull, the less it moves
      const p = Math.min(MAX, dy * 0.5)
      if (p >= TRIGGER && !armed.current) { armed.current = true; haptic('tap') }
      if (p < TRIGGER) armed.current = false
      setP(p)
    }
    const onEnd = async () => {
      if (startY.current === null) return
      startY.current = null
      if (pullRef.current >= TRIGGER) {
        busyRef.current = true
        setBusy(true)
        setP(56)
        try { await refreshRef.current() } finally {
          busyRef.current = false
          setBusy(false)
          setP(0)
        }
      } else {
        setP(0)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const shown = pull > 4 || busy
  const progress = Math.min(1, pull / TRIGGER)

  return (
    <div
      aria-hidden={!busy}
      aria-live="polite"
      className="fixed left-1/2 z-50 pointer-events-none"
      style={{
        top: 'env(safe-area-inset-top)',
        transform: `translate(-50%, ${shown ? pull - 44 : -60}px)`,
        transition: busy || pull === 0 ? 'transform 0.25s ease, opacity 0.2s' : 'none',
        opacity: shown ? 1 : 0,
      }}
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 2px 10px rgba(15,23,42,0.15)' }}>
        {busy ? (
          <span className="w-5 h-5 rounded-full border-2 border-[#00D4E8] border-t-transparent animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={progress >= 1 ? '#007A8A' : '#94a3b8'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: `rotate(${progress * 180}deg)`, transition: 'stroke 0.15s' }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </div>
      {busy && <span className="sr-only">Refreshing</span>}
    </div>
  )
}
