'use client'

import { useEffect, useRef, useState } from 'react'
import { T } from '@/components/ui/ios'
import { celebrate, haptic } from '@/lib/ui/feel'

interface Props {
  title: string
  steps: { text: string; minutes?: number | null }[]
  ingredients: { name: string; amount: string; prep?: string }[]
  onClose: () => void
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.2, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.3)
    })
  } catch { /* no audio */ }
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// One step per screen, big type, a timer where the step has one, and the
// screen kept awake while cooking.
export function CookMode({ title, steps, ingredients, onClose }: Props) {
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [showIng, setShowIng] = useState(false)
  const lock = useRef<{ release: () => Promise<void> } | null>(null)
  const step = steps[idx]
  const last = idx === steps.length - 1
  const total = step?.minutes ? step.minutes * 60 : 0

  // Keep the screen on
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const grab = () => nav.wakeLock?.request('screen').then((l) => { lock.current = l }).catch(() => {})
    grab()
    const onVis = () => { if (document.visibilityState === 'visible') grab() }
    document.addEventListener('visibilitychange', onVis)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock.current?.release().catch(() => {})
      document.body.style.overflow = ''
    }
  }, [])

  // Countdown
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setLeft((s) => {
        const v = (s ?? total) - 1
        if (v <= 0) { setRunning(false); beep(); haptic('warn'); return 0 }
        return v
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, total])

  const go = (to: number) => { setIdx(to); setLeft(null); setRunning(false) }
  const finish = () => { celebrate(); onClose() }
  const shown = left ?? total

  return (
    <div role="dialog" aria-modal="true" aria-label={`Cook mode: ${title}`} className="fixed inset-0 z-50 flex flex-col gfm-pop" style={{ background: T.navy, color: '#fff' }}>
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] gap-5 min-h-0">
        <div className="flex items-center justify-between">
          <button onClick={onClose} aria-label="Close cook mode" className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <button onClick={() => setShowIng((v) => !v)} className="min-h-11 px-4 rounded-full text-[15px] font-semibold" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {showIng ? 'Back to step' : 'Ingredients'}
          </button>
        </div>

        <div>
          <p className="m-0 text-[13px] font-bold tracking-[0.12em]" style={{ color: T.cyan }}>STEP {idx + 1} OF {steps.length}</p>
          <div className="flex gap-1 mt-2.5" aria-hidden="true">
            {steps.map((_, i) => <div key={i} className="flex-1 h-[5px] rounded-full" style={{ background: i < idx ? 'rgba(255,255,255,0.75)' : i === idx ? T.cyan : 'rgba(255,255,255,0.15)' }} />)}
          </div>
        </div>

        {showIng ? (
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {ingredients.map((i) => (
              <div key={i.name} className="flex justify-between gap-3 px-4 py-3 rounded-2xl text-base" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <span>{i.name}{i.prep ? <span className="text-white/55"> · {i.prep}</span> : null}</span><b className="whitespace-nowrap">{i.amount}</b>
              </div>
            ))}
          </div>
        ) : (
          <div key={idx} className="flex-1 flex flex-col justify-center gap-6 gfm-page min-h-0">
            <p className="m-0 text-[28px] md:text-[34px] leading-tight font-bold tracking-tight">{step?.text}</p>
            {total > 0 && (
              <button
                onClick={() => { if (shown === 0) { setLeft(null); setRunning(true) } else setRunning((r) => !r) }}
                className="flex items-center gap-4 rounded-3xl p-4 text-left"
                style={{ background: shown === 0 ? 'rgba(34,197,94,0.18)' : 'rgba(0,212,232,0.12)' }}
              >
                <span className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `4px solid ${shown === 0 ? '#22C55E' : T.cyan}` }}>
                  {running
                    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={T.cyan} aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                    : <svg width="26" height="26" viewBox="0 0 24 24" fill={shown === 0 ? '#22C55E' : T.cyan} aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
                </span>
                <span>
                  <span className="block text-[36px] leading-none font-extrabold tracking-tight tabular-nums">{shown === 0 ? 'Done' : mmss(shown)}</span>
                  <span className="block mt-1 text-sm text-white/65">{running ? 'Tap to pause' : shown === 0 ? 'Tap to restart' : left !== null ? 'Paused · tap to resume' : 'Tap to start the timer'}</span>
                </span>
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2.5">
          {idx > 0 && <button onClick={() => go(idx - 1)} className="min-h-14 px-5 rounded-2xl text-base font-semibold" style={{ background: 'rgba(255,255,255,0.1)' }}>Back</button>}
          <button onClick={last ? finish : () => go(idx + 1)} className="flex-1 min-h-14 rounded-2xl text-[17px] font-extrabold" style={{ background: T.cyan, color: T.navy }}>
            {last ? 'Done — enjoy it' : 'Next step'}
          </button>
        </div>
      </div>
    </div>
  )
}
