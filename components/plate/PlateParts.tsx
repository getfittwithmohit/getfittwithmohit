'use client'

import { useState } from 'react'
import {
  VERDICT_META,
  formatQty,
  totalsFor,
  verdictFromScore,
  type MealLog,
  type PlateTotals,
} from '@/lib/utils/plate'
import type { PlateTargets } from '@/lib/validation/plate'

// PEAK Plate — building blocks for app/plate/page.tsx

export const MACROS: { key: keyof PlateTotals; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#1a1f3a' },
  { key: 'protein_g', label: 'Protein', unit: 'g', color: '#22c55e' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g', color: '#4a7fd4' },
  { key: 'fat_g', label: 'Fat', unit: 'g', color: '#f59e0b' },
  { key: 'fibre_g', label: 'Fibre', unit: 'g', color: '#a855f7' },
]

const targetKey = (k: keyof PlateTotals) => k as keyof PlateTargets

// ── Rings ────────────────────────────────────────────────────────────────────

function Ring({ pct, color, size = 88, stroke = 9, children }: {
  pct: number; color: string; size?: number; stroke?: number; children: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const shown = Math.max(0, Math.min(1, pct))
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function ScoreRing({ score }: { score: number }) {
  const meta = VERDICT_META[verdictFromScore(score)]
  return (
    <Ring pct={score / 10} color={meta.color} size={96} stroke={10}>
      <span className="text-3xl font-semibold text-[#0f172a] leading-none">{score}</span>
      <span className="text-sm text-[#64748b] mt-0.5">out of 10</span>
    </Ring>
  )
}

export function VerdictChip({ score }: { score: number }) {
  const meta = VERDICT_META[verdictFromScore(score)]
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.emoji} {meta.label}
    </span>
  )
}

// ── Today's Plate ───────────────────────────────────────────────────────────

export function TodayPlate({ totals, targets, meals, onRemove }: {
  totals: PlateTotals
  targets: PlateTargets | null
  meals: MealLog[]
  onRemove: (id: string) => void
}) {
  const avgScore = meals.length ? Math.round((meals.reduce((s, m) => s + m.score, 0) / meals.length) * 10) / 10 : null
  const calLeft = targets ? targets.calories - totals.calories : null
  const proteinLeft = targets ? Math.round(targets.protein_g - totals.protein_g) : null

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-[#0095A8] font-medium">Today&apos;s Plate</p>
        {avgScore !== null && <span className="text-sm text-[#64748b]">Avg meal score <b className="text-[#0f172a]">{avgScore}</b>/10</span>}
      </div>

      {targets ? (
        <>
          <div className="flex items-center justify-around mb-4">
            <Ring pct={totals.calories / targets.calories} color={totals.calories > targets.calories ? '#dc2626' : '#00D4E8'}>
              <span className="text-lg font-semibold text-[#0f172a] leading-none">{totals.calories}</span>
              <span className="text-sm text-[#64748b]">/ {targets.calories} kcal</span>
            </Ring>
            <Ring pct={totals.protein_g / targets.protein_g} color="#22c55e">
              <span className="text-lg font-semibold text-[#0f172a] leading-none">{Math.round(totals.protein_g)}g</span>
              <span className="text-sm text-[#64748b]">/ {targets.protein_g}g protein</span>
            </Ring>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {MACROS.slice(2).map((m) => {
              const target = targets[targetKey(m.key)]
              const value = totals[m.key]
              return (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-sm text-[#64748b] w-12">{m.label}</span>
                  <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / target) * 100)}%`, background: m.color }} />
                  </div>
                  <span className="text-sm text-[#0f172a] w-20 text-right">{Math.round(value)} / {target}g</span>
                </div>
              )
            })}
          </div>
          <p className="text-sm text-[#64748b] text-center">
            {calLeft! >= 0
              ? <>You have <b className="text-[#0f172a]">{calLeft} kcal</b> and <b className="text-[#0f172a]">{Math.max(0, proteinLeft!)}g protein</b> left today</>
              : <>You&apos;re <b className="text-[#dc2626]">{-calLeft!} kcal</b> over today — keep the rest light and protein-first</>}
          </p>
        </>
      ) : (
        <div className="flex justify-around">
          {MACROS.slice(0, 3).map((m) => (
            <div key={m.key} className="text-center">
              <p className="text-lg font-semibold text-[#0f172a]">{Math.round(totals[m.key])}{m.unit === 'g' ? 'g' : ''}</p>
              <p className="text-sm text-[#64748b]">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {meals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex flex-col gap-2">
          {meals.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0f172a] truncate">{m.title}</p>
                <p className="text-sm text-[#64748b] capitalize">
                  {m.meal_type} · {m.calories} kcal · {Math.round(m.protein_g)}g protein
                </p>
              </div>
              <VerdictChip score={m.score} />
              <button
                onClick={() => onRemove(m.id)}
                className="text-[#94a3b8] hover:text-[#dc2626] text-base min-w-11 min-h-11 flex items-center justify-center"
                aria-label={`Remove ${m.title}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {meals.length === 0 && (
        <p className="text-sm text-[#64748b] text-center mt-3">No meals logged yet today. Scan your first one below.</p>
      )}
    </div>
  )
}

// ── Targets form (coach, or clients without a Blueprint) ─────────────────────

export function TargetsForm({ initial, onSaved, onCancel }: {
  initial: PlateTargets | null
  onSaved: (t: PlateTargets) => void
  onCancel?: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({
    calories: String(initial?.calories ?? ''),
    protein_g: String(initial?.protein_g ?? ''),
    carbs_g: String(initial?.carbs_g ?? ''),
    fat_g: String(initial?.fat_g ?? ''),
    fibre_g: String(initial?.fibre_g ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Math.round(Number(v))]))
      const res = await fetch('/api/plate/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      onSaved(data.targets)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-4">
      <p className="text-base font-semibold text-[#0f172a] mb-1">Your daily targets</p>
      <p className="text-sm text-[#64748b] mb-4">So every meal is judged against <i>your</i> goal, not a generic one.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {MACROS.map((m) => (
          <label key={m.key} className="text-sm text-[#64748b]">
            {m.label} ({m.unit})
            <input
              type="number"
              inputMode="numeric"
              value={values[m.key]}
              onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
              className="mt-1 w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#00D4E8]"
            />
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-[#dc2626] mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 bg-[#1a1f3a] text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save targets'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-4 text-sm text-[#64748b]">Cancel</button>
        )}
      </div>
    </div>
  )
}

// ── Result card ─────────────────────────────────────────────────────────────

export function ResultCard({
  scan, preview, quantities, setQuantities, targets, eatenToday,
  onSave, onDiscard, onRecheck, busy, error,
}: {
  scan: MealLog
  preview: string | null
  quantities: number[]
  setQuantities: (q: number[]) => void
  targets: PlateTargets | null
  eatenToday: PlateTotals
  onSave: () => void
  onDiscard: () => void
  onRecheck: () => void
  busy: 'save' | 'recheck' | null
  error: string
}) {
  const totals = totalsFor(scan.items, quantities)
  const edited = scan.items.some((item, i) => item.quantity !== quantities[i])

  const step = (unit: string) => (/^(g|gm|gram|grams|ml)$/i.test(unit) ? 25 : 0.5)
  const change = (i: number, dir: 1 | -1) => {
    const next = [...quantities]
    next[i] = Math.max(0, Math.round((next[i] + dir * step(scan.items[i].unit)) * 10) / 10)
    setQuantities(next)
  }

  const after = {
    calories: eatenToday.calories + totals.calories,
    protein_g: eatenToday.protein_g + totals.protein_g,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Score */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {preview
            ? <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-20 h-20 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-4xl flex-shrink-0">{scan.emoji}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[#0f172a] leading-snug">{scan.emoji} {scan.title}</p>
            <div className="mt-1.5"><VerdictChip score={scan.score} /></div>
          </div>
          <ScoreRing score={scan.score} />
        </div>
        {scan.headline && <p className="text-sm text-[#334155] mt-4 leading-relaxed">{scan.headline}</p>}
        {edited && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-[#f0fdff] border border-[#a5f3fc] rounded-xl px-3 py-2">
            <p className="text-sm text-[#0e7490]">Portions changed — numbers updated. Score is from the original scan.</p>
            <button
              onClick={onRecheck}
              disabled={busy !== null}
              className="text-xs font-medium text-[#1a1f3a] bg-[#00D4E8] px-3 py-1.5 rounded-full flex-shrink-0 disabled:opacity-50"
            >
              {busy === 'recheck' ? 'Checking…' : 'Re-check score'}
            </button>
          </div>
        )}
      </div>

      {/* Macros */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="grid grid-cols-5 gap-2 text-center">
          {MACROS.map((m) => (
            <div key={m.key}>
              <p className="text-lg font-semibold leading-none" style={{ color: m.color }}>{Math.round(totals[m.key])}</p>
              <p className="text-sm text-[#64748b] mt-1">{m.key === 'calories' ? 'kcal' : `${m.label} g`}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex flex-col gap-2.5">
          <p className="text-sm text-[#64748b]">What we see — tap − / + if the portion is off</p>
          {scan.items.map((item, i) => {
            const q = quantities[i]
            return (
              <div key={i} className={`flex items-center gap-3 ${q === 0 ? 'opacity-40' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0f172a] truncate">{item.name}</p>
                  <p className="text-sm text-[#64748b]">
                    {Math.round(item.per_unit.calories * q)} kcal · {Math.round(item.per_unit.protein_g * q * 10) / 10}g protein
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => change(i, -1)} className="w-7 h-7 rounded-full border border-[#e2e8f0] text-[#64748b]" aria-label={`Less ${item.name}`}>−</button>
                  <span className="text-sm text-[#0f172a] w-16 text-center">{formatQty(q)} {item.unit}</span>
                  <button onClick={() => change(i, 1)} className="w-7 h-7 rounded-full border border-[#e2e8f0] text-[#64748b]" aria-label={`More ${item.name}`}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Watch out */}
      {scan.flags.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs tracking-widest uppercase text-[#dc2626] font-semibold mb-3">Watch out</p>
          <div className="flex flex-col gap-2.5">
            {scan.flags.map((f, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-[#0f172a]">{f.label}</p>
                <p className="text-sm text-[#64748b] leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Make it PEAK */}
      {scan.swaps.length > 0 && (
        <div className="bg-[#1a1f3a] rounded-2xl p-5">
          <p className="text-xs tracking-widest uppercase text-[#00D4E8] font-semibold mb-3">Make it PEAK</p>
          <div className="flex flex-col gap-3">
            {scan.swaps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[#00D4E8] text-sm mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm text-white leading-snug">{s.change}</p>
                  <p className="text-sm text-[#00D4E8] mt-0.5">{s.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fits your day */}
      {targets && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs tracking-widest uppercase text-[#0095A8] font-semibold mb-3">Fits your day?</p>
          {[
            { label: 'Calories', now: eatenToday.calories, add: totals.calories, target: targets.calories, unit: 'kcal', color: '#00D4E8' },
            { label: 'Protein', now: eatenToday.protein_g, add: totals.protein_g, target: targets.protein_g, unit: 'g', color: '#22c55e' },
          ].map((row) => {
            const over = row.now + row.add > row.target
            return (
              <div key={row.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#64748b]">{row.label}</span>
                  <span className={over && row.label === 'Calories' ? 'text-[#dc2626]' : 'text-[#0f172a]'}>
                    {Math.round(row.now + row.add)} / {row.target} {row.unit}
                  </span>
                </div>
                <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#cbd5e1]" style={{ width: `${Math.min(100, (row.now / row.target) * 100)}%` }} />
                  <div className="h-full" style={{ width: `${Math.max(0, Math.min(100 - (row.now / row.target) * 100, (row.add / row.target) * 100))}%`, background: row.color }} />
                </div>
              </div>
            )
          })}
          <p className="text-sm text-[#64748b] mt-2">
            {after.calories <= targets.calories
              ? <>After this meal: <b className="text-[#0f172a]">{targets.calories - after.calories} kcal</b> and <b className="text-[#0f172a]">{Math.max(0, Math.round(targets.protein_g - after.protein_g))}g protein</b> left today.</>
              : <>This takes you <b className="text-[#dc2626]">{after.calories - targets.calories} kcal</b> over today. Try a swap above, or keep the rest of the day light.</>}
          </p>
        </div>
      )}

      {(scan.assumptions || scan.confidence) && (
        <p className="text-sm text-[#64748b] leading-relaxed px-1">
          {scan.assumptions && <>Assumed: {scan.assumptions} </>}
          AI estimate{scan.confidence ? ` (${scan.confidence} confidence)` : ''} — real values can vary by 15–20%.
        </p>
      )}

      {error && <p className="text-sm text-[#dc2626] text-center">{error}</p>}

      <div className="flex flex-col gap-2 pb-6">
        <button
          onClick={onSave}
          disabled={busy !== null || totals.calories === 0}
          className="w-full bg-[#00D4E8] text-[#1a1f3a] text-[17px] font-bold min-h-[54px] rounded-2xl hover:bg-[#00BED1] disabled:opacity-50"
        >
          {busy === 'save' ? 'Saving…' : "I'm eating this — add to today"}
        </button>
        <button
          onClick={onDiscard}
          disabled={busy !== null}
          className="w-full text-sm text-[#64748b] py-2.5"
        >
          Not now — I was just checking
        </button>
      </div>
    </div>
  )
}
