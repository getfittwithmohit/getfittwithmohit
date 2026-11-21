import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

// iPhone-style building blocks for the client hub screens (Today, Train,
// Learn, Me): large title, grouped lists, rows and badges.

export const T = {
  bg: '#F2F4F7',
  ink: '#0f172a',
  sec: '#475569',
  ter: '#64748b',
  teal: '#007A8A', // accent text on white (passes 4.5:1)
  navy: '#1a1f3a',
  cyan: '#00D4E8',
  line: '#E5E7EB',
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.ink }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 flex flex-col gap-3.5">{children}</div>
    </div>
  )
}

export function LargeTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1 pb-1">
      <div className="flex flex-col gap-0.5 min-w-0">
        {eyebrow && <span className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: T.ter }}>{eyebrow}</span>}
        <h1 className="m-0 text-[34px] leading-tight font-extrabold tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-2.5 px-1">
      <h2 className="m-0 text-xl font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}

export function Group({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-2xl overflow-hidden flex flex-col">{children}</div>
}

export type Tint = 'teal' | 'amber' | 'violet' | 'green' | 'slate'
const TINTS: Record<Tint, { fg: string; bg: string }> = {
  teal: { fg: '#007A8A', bg: '#E6F7F9' },
  amber: { fg: '#B45309', bg: '#FEF3C7' },
  violet: { fg: '#6D28D9', bg: '#EDE9FE' },
  green: { fg: '#15803D', bg: '#DCFCE7' },
  slate: { fg: '#475569', bg: '#EEF2F6' },
}

export function Row({
  icon,
  title,
  subtitle,
  href,
  onClick,
  trailing,
  tint = 'teal',
  last,
}: {
  icon: IconName
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  trailing?: ReactNode
  tint?: Tint
  last?: boolean
}) {
  const c = TINTS[tint]
  const inner = (
    <>
      <span className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: c.bg, color: c.fg }}>
        <Icon name={icon} size={20} />
      </span>
      <span
        className="flex-1 min-w-0 self-stretch flex items-center gap-2 py-3 pr-3"
        style={{ borderBottom: last ? 'none' : `1px solid ${T.line}` }}
      >
        <span className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
          <span className="text-base font-semibold truncate" style={{ color: T.ink }}>{title}</span>
          {subtitle && <span className="text-sm truncate" style={{ color: T.ter }}>{subtitle}</span>}
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          {trailing}
          <span style={{ color: '#94a3b8' }}><Icon name="chevron" size={18} /></span>
        </span>
      </span>
    </>
  )
  const cls = 'flex items-center gap-3 min-h-16 pl-3.5 w-full bg-transparent border-0 text-left'
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

export function Badge({ children, tint = 'amber' }: { children: ReactNode; tint?: Tint }) {
  const c = TINTS[tint]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl p-4 ${className}`}>{children}</div>
}

export function Skeleton({ h = 64 }: { h?: number }) {
  return <div className="rounded-2xl bg-white/70 animate-pulse" style={{ height: h }} />
}
