'use client'

import { useEffect, useState } from 'react'
import { Card, SectionTitle, T } from '@/components/ui/ios'

type Focus = { week_number: number; call_date: string | null; next_focus: string; changes: string | null }

const lines = (text: string | null) =>
  (text || '')
    .split('\n')
    .map((l) => l.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean)

// Today: what the client agreed with Coach Mohit on their latest weekly call.
// Only shown when the coach ticked "Show on Today" for that call.
export function WeekFocus() {
  const [focus, setFocus] = useState<Focus | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/focus')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setFocus(d.focus || null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const items = lines(focus?.next_focus ?? null)
  if (!focus || items.length === 0) return null
  const changes = lines(focus.changes).filter((l) => !/^no changes/i.test(l))

  return (
    <>
      <SectionTitle>This week’s focus</SectionTitle>
      <Card className="flex flex-col gap-3">
        <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
          {items.map((l, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: T.navy, color: T.cyan }}>
                {i + 1}
              </span>
              <span className="text-base leading-snug">{l}</span>
            </li>
          ))}
        </ul>
        {changes.length > 0 && (
          <div className="pt-3 border-t border-[#E5E7EB]">
            <p className="m-0 mb-1.5 text-xs font-bold tracking-[0.08em] uppercase" style={{ color: T.sec }}>What we changed</p>
            {changes.map((l, i) => (
              <p key={i} className="m-0 text-[15px] leading-snug" style={{ color: T.sec }}>{l}</p>
            ))}
          </div>
        )}
        <p className="m-0 text-[13px]" style={{ color: T.sec }}>From your Week {focus.week_number} call with Coach Mohit</p>
      </Card>
    </>
  )
}
