import type {
  Exercise,
  Feel,
  LogType,
  PlanExercise,
  PlanSession,
  WorkoutLog,
  WorkoutPlan,
  WorkoutSet,
} from '@/lib/types/workouts'

// Pure workout logic — no database calls — so it can be reasoned about and
// tested on its own.

// ── Which session is "today" ─────────────────────────────────────────────────

export type TodayState =
  | { kind: 'ready'; session: PlanSession }
  | { kind: 'done_today'; session: PlanSession; next: PlanSession | null }
  | { kind: 'rest_day'; next: PlanSession | null }
  | { kind: 'no_sessions' }

const sortSessions = (plan: WorkoutPlan) => [...plan.plan_sessions].sort((a, b) => a.sort_order - b.sort_order)

// ISO weekday for an India date string: 1 = Monday … 7 = Sunday
export function isoWeekday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 ? 7 : day
}

/**
 * Rolling plans: the session after the last one completed (wrapping round),
 * so a missed day never breaks the plan. Fixed-weekday plans: today's
 * weekday session, else a rest day showing the next one.
 *
 * `logs` = this plan's completed logs, newest first. `todayLogDates` maps
 * log id → India date it was completed.
 */
export function todaysSession(
  plan: WorkoutPlan,
  logs: WorkoutLog[],
  today: string,
  logDate: (log: WorkoutLog) => string
): TodayState {
  const sessions = sortSessions(plan)
  if (!sessions.length) return { kind: 'no_sessions' }
  const completed = logs.filter((l) => l.status === 'completed' && l.plan_id === plan.id)
  const doneToday = completed.find((l) => logDate(l) === today)

  if (plan.schedule_type === 'weekdays') {
    const weekday = isoWeekday(today)
    const todays = sessions.find((s) => s.weekday === weekday) || null
    const upcoming = (from: number) => {
      for (let i = 1; i <= 7; i++) {
        const wd = ((from - 1 + i) % 7) + 1
        const s = sessions.find((x) => x.weekday === wd)
        if (s) return s
      }
      return null
    }
    if (todays && doneToday) return { kind: 'done_today', session: todays, next: upcoming(weekday) }
    if (todays) return { kind: 'ready', session: todays }
    return { kind: 'rest_day', next: upcoming(weekday) }
  }

  const last = completed.find((l) => l.session_id && sessions.some((s) => s.id === l.session_id))
  const lastIndex = last ? sessions.findIndex((s) => s.id === last.session_id) : -1
  const nextSession = sessions[(lastIndex + 1) % sessions.length]
  if (doneToday) {
    const doneSession = sessions.find((s) => s.id === doneToday.session_id) || sessions[Math.max(0, lastIndex)]
    return { kind: 'done_today', session: doneSession, next: nextSession }
  }
  return { kind: 'ready', session: nextSession }
}

// ── Personal bests ───────────────────────────────────────────────────────────

// Estimated one-rep max (Epley). Lets "62.5 × 8" and "65 × 6" be compared.
export function estimatedOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export function setScore(logType: LogType, set: Pick<WorkoutSet, 'weight_kg' | 'reps' | 'seconds' | 'distance_km'>): number {
  switch (logType) {
    case 'weight_reps':
      return estimatedOneRepMax(Number(set.weight_kg) || 0, set.reps || 0)
    case 'reps':
      return set.reps || 0
    case 'time':
      return set.seconds || 0
    case 'time_distance':
      return Number(set.distance_km) || 0
  }
}

/**
 * A set is a personal best when it beats every earlier set of that exercise.
 * Never on the first time an exercise is logged — otherwise a new client's
 * whole first session would be "PRs".
 */
export function isPersonalBest(logType: LogType, previousBest: number | null, set: Parameters<typeof setScore>[1]): boolean {
  if (previousBest === null || previousBest <= 0) return false
  return setScore(logType, set) > previousBest + 1e-9
}

export function bestScore(logType: LogType, sets: Parameters<typeof setScore>[1][]): number | null {
  if (!sets.length) return null
  return Math.max(...sets.map((s) => setScore(logType, s)))
}

// ── What to pre-fill for each set ────────────────────────────────────────────

export interface SetTarget {
  weight_kg: number | null
  reps: number | null
  seconds: number | null
  distance_km: number | null
  /** e.g. "Last time 60 kg × 8" */
  lastTimeLabel: string | null
  /** true when the weight was raised by one step from last time */
  progressed: boolean
}

/**
 * Progression ("double progression"): if last time every set hit its target
 * reps and the client didn't rate the session Brutal, suggest one weight step
 * up. Otherwise repeat last time's weight. The client can always change it.
 */
export function targetFor(
  pe: PlanExercise,
  exercise: Exercise,
  lastSets: WorkoutSet[],
  lastFeel: Feel | null,
  progressionEnabled: boolean
): SetTarget {
  const base: SetTarget = {
    weight_kg: null,
    reps: pe.target_reps,
    seconds: pe.target_seconds,
    distance_km: pe.target_distance_km !== null ? Number(pe.target_distance_km) : null,
    lastTimeLabel: null,
    progressed: false,
  }
  if (!lastSets.length) return base

  if (exercise.log_type === 'weight_reps') {
    const weights = lastSets.map((s) => Number(s.weight_kg) || 0)
    const top = Math.max(...weights)
    const topSet = lastSets.find((s) => (Number(s.weight_kg) || 0) === top)!
    const hitAll = pe.target_reps === null || lastSets.every((s) => (s.reps || 0) >= (pe.target_reps || 0))
    const shouldProgress = progressionEnabled && hitAll && lastFeel !== 'brutal' && top > 0
    const step = Number(exercise.weight_step) || 2.5
    return {
      ...base,
      weight_kg: shouldProgress ? roundToStep(top + step, step) : top || null,
      lastTimeLabel: `Last time ${formatKg(top)} kg × ${topSet.reps ?? 0}`,
      progressed: shouldProgress,
    }
  }
  if (exercise.log_type === 'reps') {
    const best = Math.max(...lastSets.map((s) => s.reps || 0))
    return { ...base, lastTimeLabel: `Last time best ${best} reps` }
  }
  if (exercise.log_type === 'time') {
    const best = Math.max(...lastSets.map((s) => s.seconds || 0))
    return { ...base, lastTimeLabel: `Last time best ${formatSeconds(best)}` }
  }
  const best = lastSets[0]
  return {
    ...base,
    lastTimeLabel: `Last time ${formatSeconds(best.seconds || 0)}${best.distance_km ? ` · ${Number(best.distance_km)} km` : ''}`,
  }
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

// ── Summary numbers ──────────────────────────────────────────────────────────

export function totalVolume(sets: Pick<WorkoutSet, 'weight_kg' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + (Number(s.weight_kg) || 0) * (s.reps || 0), 0)
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(kg * 10 === Math.round(kg * 10) ? 1 : 2)
}

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function describeTarget(pe: PlanExercise, logType: LogType): string {
  if (logType === 'time') return `${pe.sets} × ${formatSeconds(pe.target_seconds || 0)}`
  if (logType === 'time_distance') {
    const parts = [pe.target_seconds ? `${Math.round(pe.target_seconds / 60)} min` : null, pe.target_distance_km ? `${Number(pe.target_distance_km)} km` : null]
    return parts.filter(Boolean).join(' · ') || 'Cardio'
  }
  return `${pe.sets} × ${pe.target_reps ?? '—'}`
}

export function youtubeSearchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise proper form`)}`
}
