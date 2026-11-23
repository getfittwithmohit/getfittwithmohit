import { supabase } from '@/lib/supabase/client'
import { getActivePlan, getLogs } from '@/lib/supabase/queries/workouts'
import { getTodayIdea } from '@/lib/supabase/queries/peakIdeas'
import { getClientXp, getDailyCheckins } from '@/lib/supabase/queries/dailyCheckin'
import { isoWeekday, todaysSession } from '@/lib/utils/workouts'
import { addDaysIST, istDate, todayIST } from '@/lib/utils/istDate'
import type { IconName } from '@/components/ui/Icon'
import { photosDue } from '@/lib/photos/progressPhotos'
import type { PlanSession, WorkoutLog, WorkoutPlan } from '@/lib/types/workouts'

// Everything the Today screen needs, read in parallel. Each source fails on
// its own: a slow or broken one hides its step, never the whole screen.

export type StepKey = 'ritual' | 'idea' | 'workout' | 'meals' | 'checkin'

export interface TodayStep {
  key: StepKey
  icon: IconName
  when: string // "Morning", "Workout", …
  title: string
  meta: string // shown when to-do
  doneNote: string // shown when done
  cta: string
  href: string
  done: boolean
  optional?: boolean // shown, but never the "up now" card and not counted
}

export interface SetupItem {
  key: string
  icon: IconName
  title: string
  subtitle: string
  href: string
  badge?: string
}

export interface TodayData {
  steps: TodayStep[]
  setup: SetupItem[]
  streak: number
  xpToday: number
  highFive: string | null
}

const sessionMinutes = (s: PlanSession) =>
  Math.max(10, Math.round(s.plan_exercises.reduce((m, pe) => m + pe.sets * ((pe.target_seconds || 45) + pe.rest_seconds), 0) / 60))

const logDate = (l: WorkoutLog) => istDate(new Date(l.completed_at || l.started_at))

const settle = async <T,>(p: Promise<T>): Promise<T | null> => {
  try { return await p } catch (e) { console.warn('Today:', e); return null }
}

export async function loadToday(client: { id: string; current_week: number; phase?: string }): Promise<TodayData> {
  const today = todayIST()
  const yesterday = addDaysIST(today, -1)

  const [ritualRow, streakRow, idea, plan, logs, checkins, xp, meals, setup] = await Promise.all([
    settle(Promise.resolve(supabase.from('daily_rituals').select('completed_at').eq('client_id', client.id).eq('date', today).maybeSingle()).then((r) => r.data)),
    settle(Promise.resolve(supabase.from('ritual_streaks').select('current_streak, last_completed_date').eq('client_id', client.id).maybeSingle()).then((r) => r.data)),
    settle(getTodayIdea(client.id)),
    settle(getActivePlan(client.id)),
    settle(getLogs(client.id, 40)),
    settle(getDailyCheckins(client.id, today)),
    settle(getClientXp(client.id)),
    settle(fetch('/api/plate/today').then((r) => (r.ok ? r.json() : null)) as Promise<{ meals: { calories: number | null }[] } | null>),
    settle(loadSetupItems(client)),
  ])

  const steps: TodayStep[] = []

  steps.push({
    key: 'ritual', icon: 'sunrise', when: 'Morning',
    title: 'Morning ritual',
    meta: 'Strangest Secret · Goals · Affirmations',
    doneNote: 'Done this morning',
    cta: 'Begin ritual', href: '/ritual',
    done: !!ritualRow?.completed_at,
  })

  if (idea) {
    steps.push({
      key: 'idea', icon: 'bulb', when: 'Morning',
      title: 'Today’s PEAK Idea',
      meta: idea.peak_ideas.hook,
      doneNote: 'Promise made',
      cta: idea.opened_at ? 'Finish it' : 'Read idea', href: '/ideas',
      done: !!idea.committed_at,
    })
  }

  if (plan && plan.plan_sessions.length) {
    steps.push(workoutStep(plan, logs || [], today))
  }

  const mealList = meals?.meals || []
  const kcal = Math.round(mealList.reduce((s, m) => s + (m.calories || 0), 0))
  steps.push({
    key: 'meals', icon: 'camera', when: 'Nutrition',
    title: 'PEAK Plate',
    meta: mealList.length ? `${mealList.length} meal${mealList.length === 1 ? '' : 's'} logged · ${kcal} kcal` : 'Snap a meal · calories, macros, swaps',
    doneNote: '',
    cta: 'Snap a meal', href: '/plate',
    done: false, optional: true,
  })

  steps.push({
    key: 'checkin', icon: 'moon', when: 'Before bed',
    title: 'Daily check-in',
    meta: '1 minute · earns XP',
    doneNote: 'Checked in · tap to edit',
    cta: 'Check in now', href: '/daily-checkin',
    done: !!checkins?.some((c) => c.checkin_date === today),
  })

  const streak = streakRow && streakRow.last_completed_date >= yesterday ? streakRow.current_streak || 0 : 0
  const xpToday = (xp || []).filter((e) => e.event_date === today).reduce((s, e) => s + e.points, 0)
  const recentFive = (logs || []).find((l) => l.status === 'completed' && l.coach_high_five && logDate(l) >= addDaysIST(today, -3))

  return {
    steps,
    setup: setup || [],
    streak,
    xpToday,
    highFive: recentFive ? recentFive.session_name : null,
  }
}

function workoutStep(plan: WorkoutPlan, logs: WorkoutLog[], today: string): TodayStep {
  const state = todaysSession(plan, logs, today, logDate)
  const base = { key: 'workout' as const, icon: 'dumbbell' as IconName, when: 'Workout' }
  if (state.kind === 'ready') {
    const s = state.session
    return { ...base, title: s.name, meta: `${s.label} · ${s.plan_exercises.length} exercises · ~${sessionMinutes(s)} min`, doneNote: '', cta: 'Start workout', href: '/workout', done: false }
  }
  if (state.kind === 'done_today') {
    return { ...base, title: state.session.name, meta: '', doneNote: state.next ? `Done · next up: ${state.next.name}` : 'Done · recover well', cta: '', href: '/workout/plan', done: true }
  }
  if (state.kind === 'rest_day') {
    return { ...base, title: 'Rest day', meta: '', doneNote: state.next ? `Recover · next up: ${state.next.name}` : 'Recover well', cta: '', href: '/workout/plan', done: true }
  }
  return { ...base, title: 'Workout', meta: 'Your plan is being built', doneNote: '', cta: 'See plan', href: '/workout/plan', done: false, optional: true }
}

// Setup tasks and the weekly check-in: what used to be "Pending" on Home.
export async function loadSetupItems(client: { id: string; current_week: number; phase?: string }): Promise<SetupItem[]> {
  const today = todayIST()
  const weekday = isoWeekday(today) // 5 = Fri, 6 = Sat, 7 = Sun
  const checkinWindow = weekday >= 5

  const [pledge, identity, weekly, photoWeeks] = await Promise.all([
    supabase.from('commitment_pledges').select('id').eq('client_id', client.id).maybeSingle(),
    supabase.from('identity_cards').select('id').eq('client_id', client.id).maybeSingle(),
    checkinWindow && client.current_week
      ? supabase.from('weekly_checkins').select('id').eq('client_id', client.id).eq('week_number', client.current_week).maybeSingle()
      : Promise.resolve({ data: { id: 'n/a' } }),
    supabase.from('progress_photos').select('week_number').eq('client_id', client.id),
  ])

  const items: SetupItem[] = []
  if (!weekly.data) items.push({ key: 'weekly', icon: 'clipboard', title: `Week ${client.current_week} check-in`, subtitle: 'About 10 minutes · weight, measurements', href: '/checkin', badge: weekday === 7 ? 'Due today' : 'Due Sun' })
  const sets = (photoWeeks.data || []).map((r) => ({ week: r.week_number ?? 1 }))
  if (!photoWeeks.error && photosDue(sets, client.current_week, client.phase || '')) {
    items.push({ key: 'photos', icon: 'camera', title: 'Progress photos', subtitle: 'Front, side, back · 2 minutes', href: '/me/photos', badge: 'Due' })
  }
  if (!pledge.data) items.push({ key: 'pledge', icon: 'pen', title: 'Sign your pledge', subtitle: 'Your promise to yourself', href: '/pledge' })
  if (!identity.data) items.push({ key: 'identity', icon: 'target', title: 'Purpose & identity', subtitle: 'Your why, values and vision', href: '/identity' })
  return items
}
