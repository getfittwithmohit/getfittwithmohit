'use client'

import { ReactNode } from 'react'
import { Screen, T } from '@/components/ui/ios'
import { go } from '@/lib/ui/navigate'

interface FormShellProps {
  eyebrow: string
  title: string
  subtitle?: string
  /** Segmented progress inside the hero. Omit to hide it. */
  progress?: { current: number; total: number; label?: string }
  /** Top-left link. Omit `back` to hide it. */
  back?: { label: string; href: string } | null
  /** Extra control on the top row, right side (e.g. Sign out). */
  topRight?: ReactNode
  /** Small pill under the subtitle (e.g. phase). */
  badge?: { text: string; color: string }
  /** Re-keys the content so each step fades in. */
  stepKey?: string | number
  children: ReactNode
}

// The light iOS shell used by every multi-step client form: back link,
// navy hero with logo + title + segmented progress, then the step content.
export function FormShell({
  eyebrow,
  title,
  subtitle,
  progress,
  back = { label: 'Today', href: '/home' },
  topRight,
  badge,
  stepKey,
  children,
}: FormShellProps) {
  return (
    <Screen>
      {(back || topRight) && (
        <div className="flex items-center justify-between -mb-1">
          {back ? (
            <button onClick={() => go(back.href)} className="text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              {back.label}
            </button>
          ) : <span />}
          {topRight}
        </div>
      )}

      <div className="rounded-3xl p-5" style={{ background: T.navy }}>
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="" className="w-12 h-12 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>{eyebrow}</p>
            <p className="m-0 mt-0.5 text-white text-[22px] leading-tight font-bold">{title}</p>
          </div>
        </div>
        {subtitle && <p className="m-0 mt-3 text-[15px] leading-relaxed text-white/70">{subtitle}</p>}
        {badge && (
          <span
            className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: `${badge.color}26`, color: badge.color }}
          >
            {badge.text}
          </span>
        )}
        {progress && (
          <div className="mt-4">
            <div className="flex justify-between text-[13px] font-semibold mb-2 text-white/60">
              <span>{progress.label ?? `Section ${progress.current} of ${progress.total}`}</span>
              <span>{Math.round((Math.min(progress.current, progress.total) / progress.total) * 100)}%</span>
            </div>
            <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.current}>
              {Array.from({ length: progress.total }, (_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.14)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: i < progress.current ? '100%' : '0%', background: i === progress.current - 1 ? T.cyan : 'rgba(255,255,255,0.75)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div key={stepKey} className="gfm-page flex flex-col gap-3.5">
        {children}
      </div>
    </Screen>
  )
}
