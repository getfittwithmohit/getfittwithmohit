'use client'

import { useEffect, useState } from 'react'
import { DAILY_TARGETS, levelFor } from '@/lib/constants/dailyCheckin'
import { getClientXp, getDailyCheckins, type DailyCheckin } from '@/lib/supabase/queries/dailyCheckin'
import { addDaysIST, formatDayLabel, istDate, todayIST } from '@/lib/utils/istDate'

const WORKOUT_ICON: Record<string, string> = { done: '✅', modified: '🔁', skipped: '❌' }

function average(values: (number | null | undefined)[]) {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

// Coach view of one client's last 30 days of daily check-ins.
export function DailyHistory({ clientId }: { clientId: string }) {
  const [rows, setRows] = useState<DailyCheckin[]>([])
  const [xp, setXp] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const today = todayIST()
  const from = addDaysIST(today, -29)

  useEffect(() => {
    Promise.all([getDailyCheckins(clientId, from), getClientXp(clientId)])
      .then(([checkins, events]) => {
        setRows(checkins)
        setXp(events.reduce((s, e) => s + e.points, 0))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [clientId, from])

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading daily check-ins…</p>
  if (error) return <p className="text-sm text-[#ef4444] text-center py-16">{error}</p>

  const byDate = new Map(rows.map((r) => [r.checkin_date, r]))
  const days = Array.from({ length: 30 }, (_, i) => addDaysIST(today, -i))
  const level = levelFor(xp)
  const last7 = rows.filter((r) => r.checkin_date >= addDaysIST(today, -6))

  const stats = [
    { label: 'Check-ins (30d)', value: `${rows.length}/30` },
    { label: 'Workouts done (7d)', value: `${last7.filter((r) => r.workout_status === 'done').length}/7` },
    { label: 'Avg nutrition (7d)', value: average(last7.map((r) => r.nutrition_score))?.toFixed(1) ?? '–' },
    { label: 'Avg steps (7d)', value: average(last7.map((r) => r.steps))?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '–' },
    { label: 'Avg sleep (7d)', value: average(last7.map((r) => r.sleep_hours))?.toFixed(1).concat(' h') ?? '–' },
    { label: 'Avg energy (7d)', value: average(last7.map((r) => r.energy))?.toFixed(1) ?? '–' },
    { label: 'Avg water (7d)', value: average(last7.map((r) => r.water_litres))?.toFixed(1).concat(' L') ?? '–' },
    { label: 'Total XP', value: `${xp.toLocaleString('en-IN')} · ${level.name}` },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-semibold text-[#0f172a] mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[5.5rem_repeat(6,minmax(0,1fr))] gap-1 px-3 py-2 text-[10px] text-[#94a3b8] uppercase tracking-wide border-b border-[#e2e8f0]">
          <span>Day</span><span>Workout</span><span>Nutr.</span><span>Steps</span><span>Sleep</span><span>Energy</span><span>Water</span>
        </div>
        {days.map((day) => {
          const r = byDate.get(day)
          if (!r) {
            return (
              <div key={day} className="grid grid-cols-[5.5rem_1fr] gap-1 px-3 py-2 text-xs border-b border-[#f8fafc]">
                <span className="text-[#94a3b8]">{formatDayLabel(day)}</span>
                <span className="text-[#cbd5e1]">— no check-in</span>
              </div>
            )
          }
          const late = istDate(new Date(r.submitted_at)) !== r.checkin_date
          const miss = (ok: boolean) => (ok ? 'text-[#0f172a]' : 'text-[#ef4444]')
          const hasNotes = r.workout_note || r.nutrition_note || r.support_needed
          return (
            <div key={day} className="border-b border-[#f8fafc]">
              <button
                onClick={() => setOpen(open === day ? null : day)}
                className={`w-full grid grid-cols-[5.5rem_repeat(6,minmax(0,1fr))] gap-1 px-3 py-2 text-xs text-left hover:bg-[#f8fafc] ${r.support_needed ? 'bg-red-50' : ''}`}
              >
                <span className="text-[#64748b]">
                  {formatDayLabel(day)}
                  {late && <span className="text-amber-600"> · late</span>}
                  {hasNotes && <span className="text-[#4a7fd4]"> ›</span>}
                </span>
                <span>{WORKOUT_ICON[r.workout_status]}</span>
                <span className={miss(r.nutrition_score >= DAILY_TARGETS.nutrition)}>{r.nutrition_score}/10</span>
                <span className={miss((r.steps ?? 0) >= DAILY_TARGETS.steps)}>{r.steps?.toLocaleString('en-IN') ?? '–'}</span>
                <span className={miss((r.sleep_hours ?? 0) >= DAILY_TARGETS.sleepHours)}>{r.sleep_hours}h · {r.sleep_quality}</span>
                <span>{r.energy}/10</span>
                <span className={miss((r.water_litres ?? 0) >= DAILY_TARGETS.waterLitres)}>{r.water_litres}L</span>
              </button>
              {open === day && (
                <div className="px-3 pb-3 text-xs text-[#64748b] flex flex-col gap-1">
                  {r.workout_note && <p>🏋️ {r.workout_note}</p>}
                  {r.nutrition_note && <p>🍽️ {r.nutrition_note}</p>}
                  <p>Rituals: ✍️ Goal writing {r.goal_writing_done ? '✓' : '✗'} · 🎙️ Affirmations {r.affirmations_done ? '✓' : '✗'} · 🙏 Gratitude {r.gratitude_done ? '✓' : '✗'}</p>
                  {r.support_needed && (
                    <p className="text-[#ef4444]">🆘 {r.support_message} {r.support_resolved ? '(resolved)' : ''}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-[#94a3b8]">Red = below target. Tap a day to see notes.</p>
    </div>
  )
}
