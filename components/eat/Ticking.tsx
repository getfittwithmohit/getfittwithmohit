'use client'

import Link from 'next/link'
import { useState } from 'react'
import { T } from '@/components/ui/ios'
import { shortTitle } from '@/components/eat/MealOptions'
import type { PlanMeal } from '@/lib/nutrition/plan'
import type { DaySummary, MealTick, TickStatus } from '@/lib/nutrition/ticks'

// ── Protein ring ─────────────────────────────────────────────────────────────

export function ProteinRing({ target, summary, kcalTarget, hint }: { target: number; summary: DaySummary; kcalTarget?: number; hint: string }) {
  const pct = target ? Math.min(1, summary.protein / target) : 0
  const R = 30, C = 2 * Math.PI * R
  const hit = pct >= 1
  return (
    <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.navy, color: '#fff' }}>
      <div className="relative w-[76px] h-[76px] flex-shrink-0" role="img" aria-label={`${summary.protein} of ${target} grams protein`}>
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
          <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
          <circle cx="38" cy="38" r={R} fill="none" stroke={hit ? '#22C55E' : T.cyan} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset .6s ease, stroke .3s' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold">{Math.round(pct * 100)}%</span>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.12em]" style={{ color: T.cyan }}>PROTEIN TODAY</p>
        <p className="m-0 mt-1 text-[22px] font-extrabold leading-tight">
          {summary.protein}<span className="text-base font-semibold text-white/60"> / {target} g</span>
        </p>
        {kcalTarget ? <p className="m-0 text-sm text-white/60">{summary.kcal} / {kcalTarget} kcal</p> : null}
        <p className="m-0 mt-1 text-sm leading-snug text-white/75">{hint}</p>
        {summary.uncounted > 0 && <p className="m-0 mt-0.5 text-xs text-white/50">{summary.uncounted} meal{summary.uncounted === 1 ? '' : 's'} not counted (no snap)</p>}
      </div>
    </div>
  )
}

// ── Tick buttons under a meal ────────────────────────────────────────────────

export function TickActions({ meal, optionIndex, date, onTick }: {
  meal: PlanMeal; optionIndex: number; date: string; onTick: (status: TickStatus, optionIndex?: number) => void
}) {
  const [elseOpen, setElseOpen] = useState(false)
  const many = meal.options.length > 1
  if (elseOpen) {
    return (
      <div className="flex flex-col gap-2 gfm-page">
        <p className="m-0 px-1 text-[15px]" style={{ color: T.sec }}>No problem. Snap it and PEAK Plate counts the protein for you.</p>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/plate?meal=${encodeURIComponent(meal.id)}&date=${date}&name=${encodeURIComponent(meal.name)}`} className="min-h-12 rounded-2xl flex items-center justify-center text-[15px] font-semibold" style={{ background: T.navy, color: '#fff' }}>📸 Snap it</Link>
          <button onClick={() => onTick('else')} className="min-h-12 rounded-2xl text-[15px] font-semibold bg-white" style={{ color: T.ink, boxShadow: '0 0 0 1px rgba(15,23,42,0.1)' }}>Just log it</button>
        </div>
        <button onClick={() => setElseOpen(false)} className="self-center min-h-10 text-[15px]" style={{ color: T.ter }}>Cancel</button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => onTick('ate', optionIndex)} className="min-h-12 rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2" style={{ background: T.navy, color: '#fff' }}>
        <Check /> {many ? `Ate ${shortTitle(meal.options[optionIndex]?.title || '')}` : 'Ate this'}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setElseOpen(true)} className="min-h-11 rounded-2xl text-[15px] font-semibold bg-white" style={{ color: T.ink, boxShadow: '0 0 0 1px rgba(15,23,42,0.1)' }}>Something else</button>
        <button onClick={() => onTick('skipped')} className="min-h-11 rounded-2xl text-[15px] font-semibold bg-white" style={{ color: T.sec, boxShadow: '0 0 0 1px rgba(15,23,42,0.1)' }}>Skipped</button>
      </div>
    </div>
  )
}

// ── What was logged, with Undo ───────────────────────────────────────────────

export function TickedSummary({ tick, onUndo }: { tick: MealTick; onUndo: () => void }) {
  const what = tick.status === 'skipped' ? 'Skipped' : tick.option_title || 'Something else'
  const protein = tick.status !== 'skipped' && tick.protein_g != null ? `${Math.round(Number(tick.protein_g))} g protein` : tick.status === 'else' ? 'Protein not counted' : ''
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
      <StatusDot status={tick.status} />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold truncate" style={{ color: T.ink }}>{what}</span>
        {protein && <span className="block text-[13px]" style={{ color: T.ter }}>{protein}</span>}
      </span>
      <button onClick={onUndo} className="min-h-10 px-2 text-[15px] font-semibold" style={{ color: T.teal }}>Undo</button>
    </div>
  )
}

// ── Small status marks ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<TickStatus, { bg: string; fg: string; label: string }> = {
  ate: { bg: '#DCFCE7', fg: '#15803D', label: 'On plan' },
  else: { bg: '#FEF3C7', fg: '#B45309', label: 'Other' },
  skipped: { bg: '#F1F5F9', fg: '#64748B', label: 'Skipped' },
}

export function StatusChip({ status }: { status: TickStatus | 'missing' }) {
  const s = status === 'missing' ? { bg: 'transparent', fg: T.ter, label: 'Not logged' } : STATUS_STYLE[status]
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
}

function StatusDot({ status }: { status: TickStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.fg }} aria-hidden="true">
      {status === 'ate' ? <Check /> : status === 'else' ? <span className="text-sm">🍽️</span> : <span className="text-base font-bold leading-none">–</span>}
    </span>
  )
}

function Check() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
}

// ── Evening catch-up: quick taps for meals not logged ────────────────────────

export function CatchUp({ meals, onTick }: { meals: PlanMeal[]; onTick: (meal: PlanMeal, status: TickStatus, optionIndex?: number) => void }) {
  if (!meals.length) return null
  return (
    <div className="bg-white rounded-3xl p-4 flex flex-col gap-3" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
      <div>
        <p className="m-0 text-base font-semibold" style={{ color: T.ink }}>Quick catch-up 🌙</p>
        <p className="m-0 mt-0.5 text-[15px]" style={{ color: T.sec }}>{meals.length} meal{meals.length === 1 ? '' : 's'} not logged. One tap each, then you’re done.</p>
      </div>
      {meals.map((m) => (
        <div key={m.id} className="flex flex-col gap-1.5">
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: T.ter }}>{m.name}</p>
          <div className="flex gap-2 flex-wrap">
            {m.options.map((o, i) => (
              <button key={o.id} onClick={() => onTick(m, 'ate', i)} className="min-h-10 px-3 rounded-full text-[15px] font-semibold whitespace-nowrap flex-shrink-0" style={{ background: '#DCFCE7', color: '#15803D' }}>
                ✓ {m.options.length === 1 ? 'As planned' : shortTitle(o.title)}
              </button>
            ))}
            <button onClick={() => onTick(m, 'else')} className="min-h-10 px-3 rounded-full text-[15px] font-semibold whitespace-nowrap flex-shrink-0" style={{ background: '#FEF3C7', color: '#B45309' }}>Other</button>
            <button onClick={() => onTick(m, 'skipped')} className="min-h-10 px-3 rounded-full text-[15px] font-semibold whitespace-nowrap flex-shrink-0" style={{ background: '#F1F5F9', color: '#64748B' }}>Skipped</button>
          </div>
        </div>
      ))}
    </div>
  )
}
