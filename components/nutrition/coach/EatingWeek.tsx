'use client'

import { useEffect, useState } from 'react'
import { StatusChip } from '@/components/eat/Ticking'
import { patternNotes, summarise, type MealTick, type TickStatus } from '@/lib/nutrition/ticks'
import type { PlanDoc } from '@/lib/nutrition/plan'

type Day = { date: string; ticks: MealTick[] }

const DOT: Record<TickStatus, string> = { ate: '#22C55E', else: '#F59E0B', skipped: '#CBD5E1' }

// Coach: what a client actually ate over the last 7 days, from their meal
// ticks in the Eat tab. Protein per day against target, meal-by-meal dots,
// a few plain pattern notes, and the detail for any day you tap.
export function EatingWeek({ clientId, doc, first }: { clientId: string; doc: PlanDoc; first: string }) {
  const [days, setDays] = useState<Day[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [sel, setSel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/coach/meals?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { days: Day[] }) => { if (!cancelled) setDays(d.days) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [clientId])

  if (failed) return null
  const meals = doc.meals
  const target = doc.targets.protein_g
  const shell = 'bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-5 flex flex-col gap-4'
  if (!days) return <div className={shell}><p className="text-sm text-[#94a3b8] m-0">Loading {first}’s week…</p></div>

  const selected = sel ? days.find((d) => d.date === sel)! : days[days.length - 1]
  const notes = patternNotes(meals, days, target)
  const label = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })
  const dayNum = (d: string) => Number(d.slice(8))

  return (
    <div className={shell}>
      <div>
        <p className="text-base font-semibold text-[#0f172a] m-0">What {first} actually ate</p>
        <p className="text-sm text-[#64748b] m-0 mt-0.5">Last 7 days, from meal ticks in the Eat tab · target {target} g protein</p>
      </div>

      <div className="rounded-2xl bg-[#E6F7F9] px-4 py-3">
        <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#007A8A] m-0 mb-1">Patterns</p>
        <ul className="m-0 pl-5 list-disc text-sm text-[#0f172a] flex flex-col gap-0.5">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </div>

      <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Days">
        {days.map((d) => {
          const s = summarise(meals, d.ticks)
          const pct = target ? Math.min(1, s.protein / target) : 0
          const isToday = d.date === days[days.length - 1].date
          // Today isn't over: show it neutral until the target is reached
          const color = !s.ticked ? '#E2E8F0' : pct >= 0.9 ? '#22C55E' : isToday ? '#00D4E8' : pct >= 0.6 ? '#F59E0B' : '#EF4444'
          const on = d.date === selected.date
          return (
            <button key={d.date} role="tab" aria-selected={on} onClick={() => setSel(d.date)}
              className={`rounded-xl p-1.5 flex flex-col items-center gap-1.5 transition-colors ${on ? 'bg-[#1a1f3a]' : 'bg-[#F8FAFC] hover:bg-[#F1F5F9]'}`}>
              <span className={`text-[11px] font-semibold leading-tight text-center ${on ? 'text-white/70' : 'text-[#64748b]'}`}>{label(d.date)}<br className="sm:hidden" /> {dayNum(d.date)}</span>
              <span className="w-full h-16 rounded-md bg-black/5 flex items-end overflow-hidden" aria-hidden="true">
                <span className="w-full rounded-md" style={{ height: `${Math.max(s.ticked ? 6 : 0, pct * 100)}%`, background: color }} />
              </span>
              <span className={`text-xs font-bold whitespace-nowrap ${on ? 'text-white' : 'text-[#0f172a]'}`}>{s.ticked ? <>{s.protein}<span className="hidden sm:inline"> g</span></> : '–'}</span>
              <span className="flex gap-0.5 flex-wrap justify-center" aria-label={`${s.ate} on plan, ${s.else} other, ${s.skipped} skipped`}>
                {meals.map((m) => {
                  const t = d.ticks.find((x) => x.meal_id === m.id)
                  return <span key={m.id} className="w-1.5 h-1.5 rounded-full" style={t ? { background: DOT[t.status] } : { boxShadow: `inset 0 0 0 1px ${on ? 'rgba(255,255,255,0.4)' : '#CBD5E1'}` }} />
                })}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-[#94a3b8] m-0 -mt-2">Bars: protein in grams vs target. Dots: <span className="text-[#16a34a]">●</span> on plan · <span className="text-[#d97706]">●</span> something else · <span className="text-[#94a3b8]">●</span> skipped · ○ not logged</p>

      <div className="flex flex-col">
        <p className="text-xs font-semibold text-[#64748b] m-0 mb-1">
          {new Date(`${selected.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          {' · '}{summarise(meals, selected.ticks).protein} g protein
        </p>
        {meals.map((m) => {
          const t = selected.ticks.find((x) => x.meal_id === m.id)
          return (
            <div key={m.id} className="flex items-center gap-3 py-2 border-t border-[#F1F5F9] first:border-t-0">
              <span className="flex-1 min-w-0 sm:flex sm:items-center sm:gap-3">
                <span className="block sm:w-32 sm:flex-shrink-0 text-sm font-medium text-[#0f172a]">{m.name}</span>
                {t && t.status !== 'skipped' && <span className="block flex-1 min-w-0 text-sm text-[#64748b] truncate">{t.option_title || 'Not snapped'}</span>}
              </span>
              {t && t.status !== 'skipped' && t.protein_g != null && <span className="text-xs text-[#64748b] whitespace-nowrap">{Math.round(Number(t.protein_g))} g</span>}
              <StatusChip status={t ? t.status : 'missing'} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
