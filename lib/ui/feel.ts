// Small "feel" helpers: haptic taps and a confetti burst for big moments.
// Both are no-ops when the device or the user's settings say no.

type Haptic = 'tap' | 'success' | 'warn'

const PATTERNS: Record<Haptic, number | number[]> = {
  tap: 8,
  success: [12, 60, 24],
  warn: [30, 40, 30],
}

// Android browsers support vibration; iOS Safari ignores it (press styles
// in globals.css carry the feedback there).
export function haptic(kind: Haptic = 'tap') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try { navigator.vibrate(PATTERNS[kind]) } catch { /* not allowed before a user gesture */ }
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

const COLORS = ['#00D4E8', '#1a1f3a', '#22C55E', '#F59E0B', '#4a7fd4', '#ffffff']

type Bit = { x: number; y: number; vx: number; vy: number; r: number; spin: number; w: number; h: number; c: string; round: boolean }

let running = false

// A short confetti burst from the top-centre of the screen (~1.8 s), drawn on
// a throwaway canvas that removes itself. Safe to call more than once.
export function celebrate() {
  haptic('success')
  if (typeof document === 'undefined' || reducedMotion() || running) return
  running = true

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = window.innerWidth
  const H = window.innerHeight
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: `${W}px`, height: `${H}px`, pointerEvents: 'none', zIndex: '9999' })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) { canvas.remove(); running = false; return }
  ctx.scale(dpr, dpr)

  const bits: Bit[] = Array.from({ length: 110 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const angle = (-90 + side * (15 + Math.random() * 50)) * (Math.PI / 180)
    const speed = 7 + Math.random() * 8
    return {
      x: W / 2 + side * Math.random() * 30,
      y: H * 0.32,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      w: 6 + Math.random() * 5,
      h: 8 + Math.random() * 7,
      c: COLORS[i % COLORS.length],
      round: Math.random() < 0.3,
    }
  })

  const start = performance.now()
  const DURATION = 1800

  const frame = (now: number) => {
    const t = now - start
    ctx.clearRect(0, 0, W, H)
    const fade = t > DURATION - 500 ? Math.max(0, (DURATION - t) / 500) : 1
    for (const b of bits) {
      b.vy += 0.32
      b.vx *= 0.985
      b.vy *= 0.985
      b.x += b.vx
      b.y += b.vy
      b.r += b.spin
      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(b.x, b.y)
      ctx.rotate(b.r)
      ctx.fillStyle = b.c
      if (b.c === '#ffffff') { ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1 }
      if (b.round) {
        ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)) + 2)
        if (b.c === '#ffffff') ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)) + 2)
      }
      ctx.restore()
    }
    if (t < DURATION) requestAnimationFrame(frame)
    else { canvas.remove(); running = false }
  }
  requestAnimationFrame(frame)
}
