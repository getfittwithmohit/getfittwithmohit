'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { HomeButton } from '@/components/layout/HomeButton'
import { DAILY_TARGETS } from '@/lib/constants/dailyCheckin'
import { dailyCheckinSchema, type DailyCheckinInput } from '@/lib/validation/dailyCheckin'
import {
  getClientXp,
  getDailyCheckins,
  getTodayRitualDone,
  submitDailyCheckin,
  type DailyCheckin,
  type XpEvent,
} from '@/lib/supabase/queries/dailyCheckin'
import { addDaysIST, formatDayLabel, todayIST } from '@/lib/utils/istDate'

type Draft = {
  workout_status: DailyCheckinInput['workout_status'] | null
  workout_note: string
  nutrition_score: number | null
  nutrition_note: string
  steps: string
  sleep_hours: number | null
  sleep_quality: number | null
  energy: number | null
  water_litres: number | null
  gratitude_done: boolean
  support_needed: boolean | null
  support_message: string
}

const EMPTY: Draft = {
  workout_status: null,
  workout_note: '',
  nutrition_score: null,
  nutrition_note: '',
  steps: '',
  sleep_hours: null,
  sleep_quality: null,
  energy: null,
  water_litres: null,
  gratitude_done: false,
  support_needed: null,
  support_message: '',
}

function fromSaved(c: DailyCheckin): Draft {
  return {
    workout_status: c.workout_status,
    workout_note: c.workout_note || '',
    nutrition_score: c.nutrition_score,
    nutrition_note: c.nutrition_note || '',
    steps: c.steps?.toString() ?? '',
    sleep_hours: c.sleep_hours,
    sleep_quality: c.sleep_quality,
    energy: c.energy,
    water_litres: c.water_litres,
    gratitude_done: c.gratitude_done,
    support_needed: c.support_needed,
    support_message: c.support_message || '',
  }
}

// Counts consecutive days with a check-in, ending today (or yesterday if
// today isn't in yet — the streak is still alive until midnight).
function currentStreak(dates: Set<string>, today: string): number {
  let day = dates.has(today) ? today : addDaysIST(today, -1)
  let streak = 0
  while (dates.has(day)) {
    streak++
    day = addDaysIST(day, -1)
  }
  return streak
}

export default function DailyCheckinPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const today = useMemo(() => todayIST(), [])
  const yesterday = useMemo(() => addDaysIST(today, -1), [today])

  const [history, setHistory] = useState<DailyCheckin[]>([])
  const [ritualDone, setRitualDone] = useState(false)
  const [xp, setXp] = useState<XpEvent[]>([])
  const [date, setDate] = useState(today)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editing, setEditing] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [justSaved, setJustSaved] = useState<{ onTime: boolean; coachNotified: boolean | null } | null>(null)

  const byDate = useMemo(() => new Map(history.map((c) => [c.checkin_date, c])), [history])
  const savedForDate = byDate.get(date) || null
  const yesterdayMissing = !byDate.has(yesterday)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [rows, ritual, xpRows] = await Promise.all([
          getDailyCheckins(client.id, addDaysIST(today, -60)),
          getTodayRitualDone(client.id, today),
          getClientXp(client.id),
        ])
        setHistory(rows)
        setRitualDone(ritual)
        setXp(xpRows)
        const todays = rows.find((r) => r.checkin_date === today)
        if (todays) {
          setDraft(fromSaved(todays))
          setEditing(false)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client, clientLoading, today])

  const switchDate = (next: string) => {
    setDate(next)
    setJustSaved(null)
    setFieldErrors({})
    setError(null)
    const saved = byDate.get(next)
    setDraft(saved ? fromSaved(saved) : EMPTY)
    setEditing(!saved)
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: '' }))
  }

  const handleSubmit = async () => {
    if (!client) return
    setError(null)
    const candidate = {
      workout_status: draft.workout_status ?? undefined,
      workout_note: draft.workout_note,
      nutrition_score: draft.nutrition_score ?? undefined,
      nutrition_note: draft.nutrition_note,
      steps: draft.steps.trim() === '' ? undefined : Number(draft.steps),
      sleep_hours: draft.sleep_hours ?? undefined,
      sleep_quality: draft.sleep_quality ?? undefined,
      energy: draft.energy ?? undefined,
      water_litres: draft.water_litres ?? undefined,
      gratitude_done: draft.gratitude_done,
      support_needed: draft.support_needed ?? false,
      support_message: draft.support_message,
    }
    const parsed = dailyCheckinSchema.safeParse(candidate)
    const errors: Record<string, string> = {}
    if (draft.support_needed === null) errors.support_needed = 'Let your coach know if you need support'
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        if (!errors[key]) errors[key] = issue.message
      }
    }
    if (Object.keys(errors).length || !parsed.success) {
      setFieldErrors(errors)
      setError('A few answers are missing — they are marked in red.')
      return
    }

    setSaving(true)
    try {
      const result = await submitDailyCheckin(client.id, date, parsed.data)
      const [rows, xpRows] = await Promise.all([
        getDailyCheckins(client.id, addDaysIST(today, -60)),
        getClientXp(client.id),
      ])
      setHistory(rows)
      setXp(xpRows)
      setEditing(false)
      setJustSaved({ onTime: result.onTime, coachNotified: result.coachNotified })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (checking || clientLoading || loading) return <PageLoader />

  const streak = currentStreak(new Set(history.map((h) => h.checkin_date)), today)
  const xpForDate = xp.filter((e) => e.event_date === date)
  const xpTotal = xpForDate.reduce((sum, e) => sum + e.points, 0)
  const isToday = date === today
  const canEdit = isToday || !savedForDate

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <HomeButton />
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[#00d4d4] text-xs tracking-widest uppercase mb-1">Daily Check-In</p>
              <h1 className="text-white text-lg font-medium">{formatDayLabel(date)}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-white">🔥 {streak}</p>
              <p className="text-white/40 text-xs">day streak</p>
            </div>
          </div>

          {/* Today / yesterday switch — only offered when yesterday was missed */}
          {(yesterdayMissing || date === yesterday) && (
            <div className="flex gap-2 mt-4">
              {[
                { value: today, label: 'Today' },
                { value: yesterday, label: 'Yesterday (missed)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => switchDate(opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    date === opt.value
                      ? 'bg-[#00d4d4] border-[#00d4d4] text-[#1a1f3a]'
                      : 'border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {!isToday && !savedForDate && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
            Late check-ins still help your coach see the full picture, but only same-day check-ins earn XP.
          </div>
        )}

        {/* Saved summary */}
        {savedForDate && !editing && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
            {justSaved && (
              <p className="text-sm font-medium text-[#16a34a] mb-3">
                ✓ Check-in saved{justSaved.coachNotified === true ? ' · Coach Mohit has been alerted' : ''}
              </p>
            )}
            {justSaved?.coachNotified === false && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Your support request is saved and shows on your coach&apos;s dashboard, but the email alert didn&apos;t go out.
                If it&apos;s urgent, message him on WhatsApp too.
              </p>
            )}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#94a3b8] uppercase tracking-wide">XP earned {isToday ? 'today' : 'that day'}</p>
              <p className="text-2xl font-semibold text-[#1a1f3a]">+{xpTotal}</p>
            </div>
            {xpForDate.length > 0 ? (
              <div className="flex flex-col gap-1.5 mb-4">
                {xpForDate.map((e, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#64748b]">{e.source}</span>
                    <span className="text-[#0f172a] font-medium">+{e.points}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#94a3b8] mb-4">
                {isToday ? 'Your XP will show here.' : 'Late check-ins don’t earn XP.'}
              </p>
            )}
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => { setEditing(true); setJustSaved(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#64748b] hover:bg-[#f8fafc]"
                >
                  Edit answers
                </button>
              )}
              <button
                onClick={() => window.location.href = '/leaderboard'}
                className="flex-1 py-2.5 rounded-xl bg-[#00d4d4] text-sm font-medium text-[#1a1f3a] hover:bg-[#00bcbc]"
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {editing && canEdit && (
          <>
            <Question n={1} title="Workout done?" error={fieldErrors.workout_status}>
              <Choice
                options={[
                  { value: 'done', label: '✅ Done' },
                  { value: 'modified', label: '🔁 Modified' },
                  { value: 'skipped', label: '❌ Skipped' },
                ]}
                value={draft.workout_status}
                onChange={(v) => set('workout_status', v as Draft['workout_status'])}
              />
              {draft.workout_status && draft.workout_status !== 'done' && (
                <TextLine
                  placeholder="One line — what happened?"
                  value={draft.workout_note}
                  onChange={(v) => set('workout_note', v)}
                  error={fieldErrors.workout_note}
                />
              )}
            </Question>

            <Question n={2} title="Nutrition adherence" error={fieldErrors.nutrition_score}>
              <Scale value={draft.nutrition_score} onChange={(v) => set('nutrition_score', v)} />
              {draft.nutrition_score !== null && draft.nutrition_score < DAILY_TARGETS.nutrition && (
                <TextLine
                  placeholder="One line — what threw it off? (optional)"
                  value={draft.nutrition_note}
                  onChange={(v) => set('nutrition_note', v)}
                />
              )}
            </Question>

            <Question n={3} title="Steps" error={fieldErrors.steps}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="e.g. 8500"
                value={draft.steps}
                onChange={(e) => set('steps', e.target.value)}
                className="w-full px-3 py-2.5 text-base border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#00d4d4]"
              />
              <p className="text-xs text-[#94a3b8] mt-1.5">Target: {DAILY_TARGETS.steps.toLocaleString('en-IN')}</p>
            </Question>

            <Question n={4} title="Sleep last night" error={fieldErrors.sleep_hours || fieldErrors.sleep_quality}>
              <Stepper
                value={draft.sleep_hours}
                onChange={(v) => set('sleep_hours', v)}
                step={0.5}
                min={0}
                max={14}
                start={7}
                unit="hrs"
              />
              <p className="text-xs text-[#64748b] mt-3 mb-2">Quality</p>
              <Scale value={draft.sleep_quality} onChange={(v) => set('sleep_quality', v)} />
            </Question>

            <Question n={5} title="Energy today" error={fieldErrors.energy}>
              <Scale value={draft.energy} onChange={(v) => set('energy', v)} />
            </Question>

            <Question n={6} title="Water" error={fieldErrors.water_litres}>
              <Stepper
                value={draft.water_litres}
                onChange={(v) => set('water_litres', v)}
                step={0.5}
                min={0}
                max={10}
                start={2}
                unit="L"
              />
              <p className="text-xs text-[#94a3b8] mt-1.5">Target: {DAILY_TARGETS.waterLitres} L</p>
            </Question>

            <Question n={7} title="Rituals">
              <div className="flex flex-col gap-2">
                {isToday ? (
                  ritualDone ? (
                    <p className="text-sm text-[#16a34a]">✓ Daily ritual completed in the app — goals and affirmations done</p>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/ritual'}
                      className="text-left text-sm text-[#4a7fd4] underline underline-offset-2"
                    >
                      Daily ritual not done yet — open it now →
                    </button>
                  )
                ) : (
                  <p className="text-xs text-[#94a3b8]">Your ritual is tracked automatically in the app.</p>
                )}
                <label className="flex items-center gap-3 border border-[#e2e8f0] rounded-lg px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.gratitude_done}
                    onChange={(e) => set('gratitude_done', e.target.checked)}
                    className="w-4 h-4 accent-[#00d4d4]"
                  />
                  <span className="text-sm text-[#0f172a]">🙏 Gratitude practice done</span>
                </label>
              </div>
            </Question>

            <Question n={8} title="Need support?" error={fieldErrors.support_needed}>
              <Choice
                options={[
                  { value: 'no', label: '🙌 All good' },
                  { value: 'yes', label: '🆘 Yes, I need support' },
                ]}
                value={draft.support_needed === null ? null : draft.support_needed ? 'yes' : 'no'}
                onChange={(v) => set('support_needed', v === 'yes')}
              />
              {draft.support_needed && (
                <textarea
                  rows={3}
                  placeholder="Shout — what's going on? Coach Mohit gets this straight away."
                  value={draft.support_message}
                  onChange={(e) => set('support_message', e.target.value)}
                  className={`w-full mt-3 px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-[#00d4d4] ${
                    fieldErrors.support_message ? 'border-[#ef4444]' : 'border-[#e2e8f0]'
                  }`}
                />
              )}
              {fieldErrors.support_message && <p className="text-xs text-[#ef4444] mt-1">{fieldErrors.support_message}</p>}
            </Question>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-[#00d4d4] text-[#1a1f3a] text-base font-semibold hover:bg-[#00bcbc] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : savedForDate ? 'Save changes' : 'Submit check-in'}
            </button>
            {savedForDate && (
              <button onClick={() => { setDraft(fromSaved(savedForDate)); setEditing(false) }} className="text-sm text-[#94a3b8]">
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Question({
  n,
  title,
  error,
  children,
}: {
  n: number
  title: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white border rounded-2xl p-5 ${error ? 'border-[#ef4444]' : 'border-[#e2e8f0]'}`}>
      <p className="text-sm font-medium text-[#0f172a] mb-3">
        <span className="text-[#00d4d4] mr-2">{n}</span>
        {title}
      </p>
      {children}
      {error && <p className="text-xs text-[#ef4444] mt-2">{error}</p>}
    </div>
  )
}

function Choice({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string | null
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-[6rem] py-2.5 px-3 rounded-lg border text-sm transition-colors ${
            value === o.value
              ? 'bg-[#1a1f3a] border-[#1a1f3a] text-white'
              : 'border-[#e2e8f0] text-[#64748b] hover:border-[#00d4d4]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// 1–10 as a row of tap targets — quicker than a slider on a phone
function Scale({ value, onChange }: { value: number | null; onChange: (value: number) => void }) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-10 rounded-lg text-sm font-medium transition-colors ${
            value === n
              ? 'bg-[#00d4d4] text-[#1a1f3a]'
              : value !== null && n < value
                ? 'bg-[#00d4d4]/15 text-[#0f172a]'
                : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  start,
  unit,
}: {
  value: number | null
  onChange: (value: number) => void
  step: number
  min: number
  max: number
  start: number
  unit: string
}) {
  const bump = (delta: number) => {
    const base = value ?? start
    const next = value === null ? start : Math.round((base + delta) / step) * step
    onChange(Math.min(max, Math.max(min, Number(next.toFixed(1)))))
  }
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => bump(-step)}
        className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-xl text-[#0f172a] hover:bg-[#e2e8f0]"
        aria-label={`Less ${unit}`}
      >
        −
      </button>
      <div className="flex-1 text-center">
        <span className={`text-2xl font-semibold ${value === null ? 'text-[#cbd5e1]' : 'text-[#0f172a]'}`}>
          {value === null ? '–' : value}
        </span>
        <span className="text-sm text-[#94a3b8] ml-1">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => bump(step)}
        className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-xl text-[#0f172a] hover:bg-[#e2e8f0]"
        aria-label={`More ${unit}`}
      >
        +
      </button>
    </div>
  )
}

function TextLine({
  placeholder,
  value,
  onChange,
  error,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-3 px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-[#00d4d4] ${
          error ? 'border-[#ef4444]' : 'border-[#e2e8f0]'
        }`}
      />
      {error && <p className="text-xs text-[#ef4444] mt-1">{error}</p>}
    </>
  )
}
