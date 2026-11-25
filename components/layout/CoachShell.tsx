'use client'

import { ReactNode } from 'react'
import { go } from '@/lib/ui/navigate'

interface CoachShellProps {
  title: string
  subtitle?: ReactNode
  /** Top-left back link. Defaults to the dashboard. */
  back?: { label: string; href: string }
  /** Extra controls on the right of the header card. */
  right?: ReactNode
  tabs?: readonly { key: string; label: string }[]
  activeTab?: string
  onTab?: (key: string) => void
  /** Tailwind max-width class for the page column. */
  width?: string
  children: ReactNode
}

// Shared frame for every coach tool page: back link, navy header card,
// optional pill tabs (sticky), then the content column on the soft grey.
export function CoachShell({
  title,
  subtitle,
  back = { label: 'Dashboard', href: '/coach/dashboard' },
  right,
  tabs,
  activeTab,
  onTab,
  width = 'max-w-6xl',
  children,
}: CoachShellProps) {
  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#0f172a] pb-16">
      <div className={`${width} mx-auto px-3 md:px-4 pt-3 md:pt-6`}>
        <button onClick={() => go(back.href)} className="text-[17px] min-h-11 flex items-center gap-0.5 -ml-1 text-[#007A8A]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          {back.label}
        </button>
        <div className="mt-1 rounded-3xl bg-[#1a1f3a] p-5 md:px-6 flex items-center justify-between gap-x-4 gap-y-3 flex-wrap">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase text-[#00D4E8]">Coach</p>
            <h1 className="m-0 mt-0.5 text-white text-[24px] md:text-[26px] leading-tight font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="m-0 mt-1 text-[15px] text-white/65">{subtitle}</p>}
          </div>
          {right && <div className="flex items-center gap-2 flex-wrap">{right}</div>}
        </div>
      </div>

      {tabs && (
        <div className="sticky top-0 z-20 bg-[#F2F4F7]/90 backdrop-blur-md mt-3">
          <div className={`${width} mx-auto px-3 md:px-4 py-2 flex gap-1.5 overflow-x-auto gfm-no-scrollbar`} role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => onTab?.(t.key)}
                className={`px-4 min-h-10 rounded-full text-[15px] font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === t.key ? 'bg-[#1a1f3a] text-white' : 'bg-white text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${width} mx-auto px-3 md:px-4 ${tabs ? 'pt-2' : 'pt-4'}`}>{children}</div>
    </div>
  )
}

// Light button that sits on the navy header card.
export function HeaderButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-white/85 hover:text-white text-sm font-semibold px-3.5 min-h-10 rounded-full bg-white/10 hover:bg-white/15 transition-colors whitespace-nowrap"
    >
      {children}
    </button>
  )
}
