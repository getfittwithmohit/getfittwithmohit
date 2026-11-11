'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { PEAK, TOPIC_LABEL, topicColor, type PeakTopic } from '@/lib/constants/peakIdeas'

// Full-height dark frame for every PEAK Ideas screen
export function PeakShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full" style={{ background: PEAK.bg, color: PEAK.text }}>
      <div className="mx-auto max-w-md min-h-[100dvh] flex flex-col">{children}</div>
    </div>
  )
}

export function IconButton({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: ReactNode }) {
  const cls = 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0'
  if (href) return <Link href={href} aria-label={label} className={cls} style={{ background: PEAK.surface }}>{children}</Link>
  return <button type="button" aria-label={label} onClick={onClick} className={cls} style={{ background: PEAK.surface }}>{children}</button>
}

export const Icon = {
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PEAK.soft} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PEAK.soft} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>,
  chevron: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PEAK.muted} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  flame: <svg width="18" height="18" viewBox="0 0 24 24" fill={PEAK.gold} aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1.2 2.6 2.5 3-.6-3 .1-5.6 0-8z" /></svg>,
  check: (color: string = PEAK.green) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>,
}

export function TopicPill({ topic, extra }: { topic: string; extra?: string }) {
  return (
    <span className="self-start text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ color: PEAK.ink, background: 'rgba(255,255,255,0.45)' }}>
      {TOPIC_LABEL[topic as PeakTopic] || topic}{extra ? ` · ${extra}` : ''}
    </span>
  )
}

// Abstract shapes, a different arrangement per topic, so cards feel alive without stock photos
export function TopicArt({ topic, size = 240, className = '' }: { topic: string; size?: number; className?: string }) {
  const dark = 'rgba(17,19,24,0.10)'
  const light = 'rgba(255,255,255,0.22)'
  const line = 'rgba(17,19,24,0.25)'
  const shapes: Record<string, ReactNode> = {
    Consistency: (<><circle cx="120" cy="120" r="105" fill={dark} /><circle cx="150" cy="90" r="46" fill={light} /><path d="M30 180 Q120 95 215 155" stroke={line} strokeWidth="10" fill="none" strokeLinecap="round" /></>),
    Identity: (<><circle cx="120" cy="120" r="95" fill="none" stroke={line} strokeWidth="16" /><circle cx="120" cy="120" r="40" fill={light} /></>),
    Nutrition: (<><rect x="40" y="40" width="160" height="160" rx="40" fill={dark} transform="rotate(18 120 120)" /><circle cx="150" cy="150" r="42" fill={light} /></>),
    Focus: (<><circle cx="120" cy="120" r="100" fill={dark} /><circle cx="120" cy="120" r="62" fill="none" stroke={line} strokeWidth="8" /><circle cx="120" cy="120" r="22" fill={light} /></>),
    Sleep: (<><circle cx="130" cy="110" r="90" fill={dark} /><circle cx="165" cy="85" r="70" fill={light} /></>),
    Mindset: (<><path d="M20 160 L80 70 L130 130 L170 60 L230 160 Z" fill={dark} /><circle cx="175" cy="70" r="28" fill={light} /></>),
  }
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true" className={`absolute pointer-events-none ${className}`}>
      {shapes[topic] || shapes.Consistency}
    </svg>
  )
}

export function Spinner() {
  return <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
}

export function LoadingScreen() {
  return (
    <PeakShell>
      <div className="flex-1 flex items-center justify-center"><Spinner /></div>
    </PeakShell>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="mx-4 mt-4 rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.12)', color: '#FCA5A5' }}>{message}</p>
}

// ----------------------------------------------------------------- share card

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

// Draw a 1080×1350 image and open the phone's share sheet (or download it).
export async function shareCard(opts: { topic: string; title: string; lines?: string[]; footer?: string; fileName: string }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const color = topicColor(opts.topic)

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.fillStyle = 'rgba(17,19,24,0.10)'
  ctx.beginPath(); ctx.arc(900, 220, 360, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.beginPath(); ctx.arc(820, 300, 150, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = PEAK.ink
  ctx.font = '600 38px Inter, system-ui, sans-serif'
  ctx.fillText((TOPIC_LABEL[opts.topic as PeakTopic] || opts.topic).toUpperCase(), 96, 150)

  ctx.font = '700 84px Inter, system-ui, sans-serif'
  let y = 560
  for (const l of wrap(ctx, opts.title, 888)) { ctx.fillText(l, 96, y); y += 100 }

  if (opts.lines?.length) {
    ctx.font = '500 44px Inter, system-ui, sans-serif'
    y += 30
    for (const text of opts.lines) for (const l of wrap(ctx, text, 888)) { ctx.fillText(l, 96, y); y += 62 }
  }

  ctx.font = '600 36px Inter, system-ui, sans-serif'
  ctx.fillText(opts.footer || 'PEAK Ideas · GetFittWithMohit', 96, 1250)

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  const file = new File([blob], opts.fileName, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file] }) } catch { /* closed the share sheet */ }
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
