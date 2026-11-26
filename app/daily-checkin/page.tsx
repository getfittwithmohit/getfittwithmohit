'use client'

import { celebrate } from '@/lib/ui/feel'
import { useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { Screen, T } from '@/components/ui/ios'
import { Icon, type IconName } from '@/components/ui/Icon'
import { DAILY_TARGETS } from '@/lib/constants/dailyCheckin'
import { dailyCheckinSchema, type DailyCheckinInput } from '@/lib/validation/dailyCheckin'
import {
  getClientXp,
  getDailyCheckins,
  submitDailyCheckin,
  type DailyCheckin,
  type XpEvent,
} from '@/lib/supabase/queries/dailyCheckin'
import { addDaysIST, formatDayLabel, istDate, todayIST } from '@/lib/utils/istDate'
import { getLogs } from '@/lib/supabase/queries/workouts'
import { checkinScore, summarise, type MealTick } from '@/lib/nutrition/ticks'
import type { PlanDoc } from '@/lib/nutrition/plan'

// A suggested nutrition score from today's meal ticks in the Eat tab.
// Null when there's no plan or under half the day is ticked.
async function mealTickScore(today: string): Promise<{ score: number; note: string } | null> {
  try {
    const [n, m] = await Promise.all([
      fetch('/api/me/nutrition').then((r) => (r.ok ? r.json() : null)) as Promise<{ plan: { doc: PlanDoc } | null } | null>,
      fetch(`/api/me/meals?date=${today}`).then((r) => (r.ok ? r.json() : null)) as Promise<{ ticks: MealTick[] } | null>,
    ])
    const meals = n?.plan?.doc?.meals
    if (!meals || !m) return null
    const score = checkinScore(meals, m.ticks)
    if (score === null) return null
    const s = summarise(meals, m.ticks)
    const parts = [s.ate && `${s.ate} on plan`, s.else && `${s.else} other`, s.skipped && `${s.skipped} skipped`].filter(Boolean)
    return { score, note: `Filled from your meals today: ${parts.join(', ')}. Change it if it feels off.` }
  } catch {
    return null
  }
}
import { go } from '@/lib/ui/navigate'

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
  goal_writing_done: boolean
  affirmations_done: boolean
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
  goal_writing_done: false,
  affirmations_done: false,
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
    goal_writing_done: !!c.goal_writing_done,
    affirmations_done: !!c.affirmations_done,
    gratitude_done: c.gratitude_done,
    support_needed: c.support_needed,
    support_message: c.support_message || '',
  }
}

// Unsaved answers are kept in the browser so a client who taps "Do it now"
// to finish their ritual comes back to a half-filled form, not an empty one.
const draftKey = (date: string) => `daily-checkin-draft:${date}`

function loadDraft(date: string): Draft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(date))
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : null
  } catch {
    return null
  }
}

function storeDraft(date: string, draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(draftKey(date), JSON.stringify(draft))
    else sessionStorage.removeItem(draftKey(date))
  } catch {
    // Storage can be unavailable (private mode); the form still works
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
  const [xp, setXp] = useState<XpEvent[]>([])
  const [date, setDate] = useState(today)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editing, setEditing] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [tickNote, setTickNote] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState<{ onTime: boolean; coachNotified: boolean | null } | null>(null)

  const byDate = useMemo(() => new Map(history.map((c) => [c.checkin_date, c])), [history])
  const savedForDate = byDate.get(date) || null
  const yesterdayMissing = !byDate.has(yesterday)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [rows, xpRows, workoutLogs, eaten] = await Promise.all([
          getDailyCheckins(client.id, addDaysIST(today, -60)),
          getClientXp(client.id),
          getLogs(client.id, 5).catch(() => []),
          mealTickScore(today),
        ])
        setHistory(rows)
        setXp(xpRows)
        const todays = rows.find((r) => r.checkin_date === today)
        const pending = loadDraft(today)
        // A workout finished in the app today pre-ticks "Workout done"
        const trainedToday = workoutLogs.some(
          (l) => l.status === 'completed' && l.completed_at && istDate(new Date(l.completed_at)) === today
        )
        if (pending) {
          setDraft(pending)
          setEditing(true)
        } else if (todays) {
          setDraft(fromSaved(todays))
          setEditing(false)
        } else if (trainedToday || eaten) {
          // Workout finished in the app → "done"; meals ticked in Eat → a
          // suggested nutrition score the client can still change
          setDraft({ ...EMPTY, workout_status: trainedToday ? 'done' : null, nutrition_score: eaten?.score ?? null })
          if (eaten) setTickNote(eaten.note)
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
    const pending = loadDraft(next)
    setDraft(pending || (saved ? fromSaved(saved) : EMPTY))
    setEditing(!!pending || !saved)
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value }
      storeDraft(date, next)
      return next
    })
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
      goal_writing_done: draft.goal_writing_done,
      affirmations_done: draft.affirmations_done,
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
      storeDraft(date, null)
      const [rows, xpRows] = await Promise.all([
        getDailyCheckins(client.id, addDaysIST(today, -60)),
        getClientXp(client.id),
      ])
      setHistory(rows)
      setXp(xpRows)
      setEditing(false)
      setJustSaved({ onTime: result.onTime, coachNotified: result.coachNotified })
      celebrate()
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

  const answered = [
    draft.workout_status !== null,
    draft.nutrition_score !== null,
    draft.steps.trim() !== '',
    draft.sleep_hours !== null && draft.sleep_quality !== null,
    draft.energy !== null,
    draft.water_litres !== null,
    draft.goal_writing_done || draft.affirmations_done || draft.gratitude_done,
    draft.support_needed !== null,
  ].filter(Boolean).length
  const showForm = editing && canEdit
  const ringDone = showForm ? answered : 8
  const pct = ringDone / 8

  return (
    <Screen>
      <button onClick={() => go('/home')} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Today
      </button>

      {/* Hero */}
      <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.navy }}>
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={showForm ? T.cyan : '#22C55E'} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${pct * 97.4} 97.4`} style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-base font-bold">
            {showForm ? `${answered}/8` : <Icon name="check" size={24} />}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>Daily check-in</p>
          <p className="m-0 mt-0.5 text-white text-[22px] leading-tight font-bold">{formatDayLabel(date)}</p>
          <p className="m-0 mt-1 text-[15px] text-white/70">
            {!showForm ? 'Checked in. Nice work.' : answered === 0 ? 'Two minutes. Be honest.' : answered === 8 ? 'All answered. Submit below.' : `${8 - answered} to go.`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="m-0 text-2xl font-bold text-white flex items-center justify-end gap-1"><span style={{ color: '#F59E0B' }}><Icon name="flame" size={20} /></span>{streak}</p>
          <p className="m-0 text-xs text-white/60">day streak</p>
        </div>
      </div>

      {/* Today / yesterday switch — only offered when yesterday was missed */}
      {(yesterdayMissing || date === yesterday) && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: '#E4E8EE' }} role="tablist">
          {[
            { value: today, label: 'Today' },
            { value: yesterday, label: 'Yesterday (missed)' },
          ].map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={date === opt.value}
              onClick={() => switchDate(opt.value)}
              className="min-h-10 rounded-lg text-[15px] font-semibold transition-all"
              style={date === opt.value ? { background: '#fff', color: T.ink, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: T.ter }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl px-4 py-3 text-[15px]" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>
      )}

      {!isToday && !savedForDate && (
        <div className="rounded-2xl px-4 py-3 text-[15px]" style={{ background: '#FEF3C7', color: '#92400E' }}>
          Late check-ins still help your coach see the full picture, but only same-day check-ins earn XP.
        </div>
      )}

      {/* Saved summary */}
      {savedForDate && !editing && (
        <div className="bg-white rounded-2xl p-5">
          {justSaved && (
            <div className="flex items-center gap-2.5 mb-4">
              <span className="gfm-pop w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: '#16A34A' }}><Icon name="check" size={18} /></span>
              <p className="m-0 text-base font-semibold" style={{ color: '#15803D' }}>
                Check-in saved{justSaved.coachNotified === true ? ' · Coach Mohit has been alerted' : ''}
              </p>
            </div>
          )}
          {justSaved?.coachNotified === false && (
            <p className="text-sm rounded-xl px-3 py-2 mb-4" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Your support request is saved and shows on your coach&apos;s dashboard, but the email alert didn&apos;t go out.
              If it&apos;s urgent, message him on WhatsApp too.
            </p>
          )}
          <div className="flex items-end justify-between mb-3">
            <p className="m-0 text-[13px] font-semibold uppercase tracking-wide" style={{ color: T.ter }}>XP earned {isToday ? 'today' : 'that day'}</p>
            <p className="m-0 text-[34px] leading-none font-extrabold tracking-tight" style={{ color: T.teal }}>+{xpTotal}</p>
          </div>
          {xpForDate.length > 0 ? (
            <div className="flex flex-col mb-4">
              {xpForDate.map((e, i) => (
                <div key={i} className="flex justify-between text-[15px] py-2" style={{ borderTop: `1px solid ${T.line}` }}>
                  <span style={{ color: T.sec }}>{e.source}</span>
                  <span className="font-semibold" style={{ color: T.ink }}>+{e.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[15px] mb-4" style={{ color: T.ter }}>
              {isToday ? 'Your XP will show here.' : 'Late check-ins don’t earn XP.'}
            </p>
          )}
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => { setEditing(true); setJustSaved(null) }}
                className="flex-1 min-h-[50px] rounded-2xl text-base font-medium"
                style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.ink }}
              >
                Edit answers
              </button>
            )}
            <button
              onClick={() => go('/leaderboard')}
              className="flex-1 min-h-[50px] rounded-2xl text-base font-semibold flex items-center justify-center gap-2"
              style={{ background: T.navy, color: T.cyan }}
            >
              <Icon name="trophy" size={18} />Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <>
          <Question n={1} icon="dumbbell" title="Workout done?" done={draft.workout_status !== null} error={fieldErrors.workout_status}>
            <Choice
              options={[
                { value: 'done', label: 'Done' },
                { value: 'modified', label: 'Modified' },
                { value: 'skipped', label: 'Skipped' },
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

          <Question n={2} icon="leaf" title="Nutrition adherence" hint="1 = off plan · 10 = spot on" done={draft.nutrition_score !== null} error={fieldErrors.nutrition_score}>
            <Scale value={draft.nutrition_score} onChange={(v) => { setTickNote(null); set('nutrition_score', v) }} />
            {tickNote && date === today && <p className="m-0 mt-2 text-sm" style={{ color: T.teal }}>{tickNote}</p>}
            {draft.nutrition_score !== null && draft.nutrition_score < DAILY_TARGETS.nutrition && (
              <TextLine
                placeholder="One line — what threw it off? (optional)"
                value={draft.nutrition_note}
                onChange={(v) => set('nutrition_note', v)}
              />
            )}
          </Question>

          <Question n={3} icon="footprints" title="Steps" hint={`Target ${DAILY_TARGETS.steps.toLocaleString('en-IN')}`} done={draft.steps.trim() !== ''} error={fieldErrors.steps}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 8500"
              value={draft.steps}
              onChange={(e) => set('steps', e.target.value)}
              className="w-full px-4 min-h-[52px] text-xl font-semibold rounded-xl focus:outline-none focus:ring-2"
              style={{ background: '#F2F4F7', color: T.ink, ['--tw-ring-color' as string]: T.cyan }}
            />
          </Question>

          <Question n={4} icon="moon" title="Sleep last night" done={draft.sleep_hours !== null && draft.sleep_quality !== null} error={fieldErrors.sleep_hours || fieldErrors.sleep_quality}>
            <Stepper
              value={draft.sleep_hours}
              onChange={(v) => set('sleep_hours', v)}
              step={0.5}
              min={0}
              max={14}
              start={7}
              unit="hrs"
            />
            <p className="text-[13px] font-semibold uppercase tracking-wide mt-4 mb-2" style={{ color: T.ter }}>Quality</p>
            <Scale value={draft.sleep_quality} onChange={(v) => set('sleep_quality', v)} />
          </Question>

          <Question n={5} icon="bolt" title="Energy today" done={draft.energy !== null} error={fieldErrors.energy}>
            <Scale value={draft.energy} onChange={(v) => set('energy', v)} />
          </Question>

          <Question n={6} icon="droplet" title="Water" hint={`Target ${DAILY_TARGETS.waterLitres} L`} done={draft.water_litres !== null} error={fieldErrors.water_litres}>
            <Stepper
              value={draft.water_litres}
              onChange={(v) => set('water_litres', v)}
              step={0.5}
              min={0}
              max={10}
              start={2}
              unit="L"
            />
          </Question>

          <Question n={7} icon="sun" title="Rituals completed?" done={draft.goal_writing_done || draft.affirmations_done || draft.gratitude_done}>
            <div className="flex flex-col gap-2">
              <RitualTick icon="pen" label="Goal writing" checked={draft.goal_writing_done} onChange={(v) => set('goal_writing_done', v)} />
              <RitualTick icon="mic" label="Affirmations" checked={draft.affirmations_done} onChange={(v) => set('affirmations_done', v)} />
              <RitualTick icon="heart" label="Gratitude practice" checked={draft.gratitude_done} onChange={(v) => set('gratitude_done', v)} />
            </div>
          </Question>

          <Question n={8} icon="chat" title="Need support?" done={draft.support_needed !== null} error={fieldErrors.support_needed}>
            <Choice
              options={[
                { value: 'no', label: 'All good' },
                { value: 'yes', label: 'I need support' },
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
                className="w-full mt-3 px-4 py-3 text-base rounded-xl focus:outline-none focus:ring-2"
                style={{ background: '#F2F4F7', color: T.ink, ['--tw-ring-color' as string]: T.cyan, boxShadow: fieldErrors.support_message ? 'inset 0 0 0 1.5px #ef4444' : undefined }}
              />
            )}
            {fieldErrors.support_message && <p className="text-sm text-[#DC2626] mt-1.5">{fieldErrors.support_message}</p>}
          </Question>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full min-h-[56px] rounded-2xl text-[17px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{ background: T.cyan, color: T.navy }}
          >
            {saving ? 'Saving…' : savedForDate ? 'Save changes' : 'Submit check-in'}
          </button>
          {savedForDate && (
            <button
              onClick={() => { storeDraft(date, null); setDraft(fromSaved(savedForDate)); setEditing(false) }}
              className="w-full min-h-[52px] rounded-2xl text-base font-medium"
              style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.sec }}
            >
              Cancel
            </button>
          )}
        </>
      )}
    </Screen>
  )
}

function RitualTick({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: IconName
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-xl px-3 min-h-[52px] text-left transition-colors"
      style={checked ? { background: '#DCFCE7' } : { background: '#F2F4F7' }}
    >
      <span style={{ color: checked ? '#15803D' : T.sec }}><Icon name={icon} size={20} /></span>
      <span className="flex-1 text-base font-medium" style={{ color: T.ink }}>{label}</span>
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        style={checked ? { background: '#16A34A', color: '#fff' } : { background: '#fff', border: `1.5px solid #CBD5E1` }}
      >
        {checked && <Icon name="check" size={16} />}
      </span>
    </button>
  )
}

function Question({
  n,
  icon,
  title,
  hint,
  done,
  error,
  children,
}: {
  n: number
  icon: IconName
  title: string
  hint?: string
  done?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-4" style={error ? { boxShadow: 'inset 0 0 0 1.5px #ef4444' } : undefined}>
      <div className="flex items-center gap-3 mb-3.5">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={done ? { background: '#DCFCE7', color: '#15803D' } : { background: '#E6F7F9', color: T.teal }}
          aria-hidden="true"
        >
          {done ? <Icon name="check" size={20} /> : <Icon name={icon} size={20} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[17px] font-semibold leading-snug" style={{ color: T.ink }}>
            <span className="sr-only">{n}. </span>{title}
          </p>
          {hint && <p className="m-0 text-sm" style={{ color: T.ter }}>{hint}</p>}
        </div>
      </div>
      {children}
      {error && <p className="text-sm text-[#DC2626] mt-2">{error}</p>}
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
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="flex-1 min-w-[6rem] min-h-[50px] px-3 rounded-xl text-base font-semibold transition-colors"
          style={value === o.value ? { background: T.navy, color: T.cyan } : { background: '#F2F4F7', color: T.ink }}
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
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className="h-11 rounded-lg text-base font-semibold transition-colors"
          style={
            value === n
              ? { background: T.navy, color: T.cyan }
              : value !== null && n < value
                ? { background: '#CCF4F8', color: T.ink }
                : { background: '#F2F4F7', color: T.sec }
          }
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
  const btn = 'w-14 h-14 rounded-full text-2xl font-medium flex items-center justify-center transition-colors'
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => bump(-step)} className={btn} style={{ background: '#F2F4F7', color: T.ink }} aria-label={`Less ${unit}`}>
        −
      </button>
      <div className="flex-1 text-center">
        <span className="text-[40px] leading-none font-extrabold tracking-tight" style={{ color: value === null ? '#CBD5E1' : T.ink }}>
          {value === null ? '–' : value}
        </span>
        <span className="text-base ml-1" style={{ color: T.ter }}>{unit}</span>
      </div>
      <button type="button" onClick={() => bump(step)} className={btn} style={{ background: T.navy, color: T.cyan }} aria-label={`More ${unit}`}>
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
        className="w-full mt-3 px-4 min-h-[50px] text-base rounded-xl focus:outline-none focus:ring-2"
        style={{ background: '#F2F4F7', color: T.ink, ['--tw-ring-color' as string]: T.cyan, boxShadow: error ? 'inset 0 0 0 1.5px #ef4444' : undefined }}
      />
      {error && <p className="text-sm text-[#DC2626] mt-1.5">{error}</p>}
    </>
  )
}
