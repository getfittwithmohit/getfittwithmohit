import { supabase } from '@/lib/supabase/client'
import type {
  Exercise,
  Feel,
  LogType,
  PainFlag,
  PlanExercise,
  PlanSession,
  WorkoutLog,
  WorkoutPlan,
  WorkoutSet,
} from '@/lib/types/workouts'
import { bestScore } from '@/lib/utils/workouts'

// Workout queries. All run with the signed-in user's session; Row Level
// Security (supabase/workouts.sql) decides what each caller can read and
// write. Every function throws on failure so the screen can show it.

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message || 'unknown error'}`)
}

// PostgREST returns numeric columns as strings
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))

function normaliseExercise(e: Record<string, unknown>): Exercise {
  return { ...(e as unknown as Exercise), weight_step: Number(e.weight_step) || 2.5, cues: (e.cues as string[]) || [] }
}

function normalisePlan(raw: Record<string, unknown>): WorkoutPlan {
  const plan = raw as unknown as WorkoutPlan
  const sessions = [...(plan.plan_sessions || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      ...s,
      plan_exercises: [...(s.plan_exercises || [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((pe) => ({
          ...pe,
          target_distance_km: num(pe.target_distance_km),
          exercise: pe.exercise ? normaliseExercise(pe.exercise as unknown as Record<string, unknown>) : undefined,
        })),
    }))
  return { ...plan, plan_sessions: sessions }
}

function normaliseSet(s: Record<string, unknown>): WorkoutSet {
  return {
    ...(s as unknown as WorkoutSet),
    weight_kg: num(s.weight_kg),
    distance_km: num(s.distance_km),
  }
}

const PLAN_SELECT = '*, plan_sessions(*, plan_exercises(*, exercise:exercises(*)))'

// ── Library ──────────────────────────────────────────────────────────────────

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name')
  if (error) fail('Could not load exercises', error)
  return (data || []).map(normaliseExercise)
}

export type ExerciseInput = Pick<
  Exercise,
  'name' | 'muscle_group' | 'equipment' | 'locations' | 'log_type' | 'video_url' | 'cues' | 'weight_step' | 'home_alt_id' | 'hotel_alt_id' | 'is_active'
>

export async function saveExercise(input: ExerciseInput, id?: string): Promise<Exercise> {
  const row = {
    ...input,
    name: input.name.trim(),
    equipment: input.equipment.trim() || 'Bodyweight',
    video_url: input.video_url?.trim() || null,
    cues: input.cues.map((c) => c.trim()).filter(Boolean),
  }
  const query = id
    ? supabase.from('exercises').update(row).eq('id', id).select().single()
    : supabase.from('exercises').insert(row).select().single()
  const { data, error } = await query
  if (error || !data) {
    if (error?.code === '23505') throw new Error(`An exercise called "${row.name}" already exists.`)
    fail('Could not save exercise', error)
  }
  return normaliseExercise(data)
}

// ── Plans (coach) ────────────────────────────────────────────────────────────

export interface PlanListItem {
  id: string
  name: string
  client_id: string | null
  client_name: string | null
  status: 'active' | 'archived'
  schedule_type: 'rolling' | 'weekdays'
  start_date: string | null
  updated_at: string
  session_count: number
}

export async function getPlanList(): Promise<PlanListItem[]> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('id, name, client_id, status, schedule_type, start_date, updated_at, client:clients(full_name), plan_sessions(id)')
    .order('updated_at', { ascending: false })
  if (error) fail('Could not load plans', error)
  return (data || []).map((p) => {
    const client = (Array.isArray(p.client) ? p.client[0] : p.client) as { full_name: string } | null
    return {
      id: p.id,
      name: p.name,
      client_id: p.client_id,
      client_name: client?.full_name || null,
      status: p.status,
      schedule_type: p.schedule_type,
      start_date: p.start_date,
      updated_at: p.updated_at,
      session_count: (p.plan_sessions || []).length,
    }
  })
}

export async function getPlan(id: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase.from('workout_plans').select(PLAN_SELECT).eq('id', id).maybeSingle()
  if (error) fail('Could not load plan', error)
  return data ? normalisePlan(data) : null
}

export async function createTemplate(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('workout_plans')
    .insert({ name: name.trim(), client_id: null })
    .select('id')
    .single()
  if (error || !data) fail('Could not create plan', error)
  await addSession(data.id, 'A', 'Session A', 0)
  return data.id
}

export async function updatePlan(
  id: string,
  changes: Partial<Pick<WorkoutPlan, 'name' | 'schedule_type' | 'sessions_per_week' | 'start_date' | 'weeks' | 'progression_enabled'>>
) {
  const { error } = await supabase
    .from('workout_plans')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) fail('Could not save plan', error)
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from('workout_plans').delete().eq('id', id)
  if (error) fail('Could not delete plan', error)
}

/** Assign (clientId set) or save as template (clientId null). Returns the new plan id. */
export async function copyPlan(planId: string, clientId: string | null, startDate: string | null, name?: string): Promise<string> {
  const { data, error } = await supabase.rpc('gfm_copy_plan', {
    p_plan_id: planId,
    p_client_id: clientId,
    p_start_date: startDate,
    p_name: name || null,
  })
  if (error || !data) fail(clientId ? 'Could not assign the plan' : 'Could not save the template', error)
  return data as string
}

export async function addSession(planId: string, label: string, name: string, sortOrder: number): Promise<PlanSession> {
  const { data, error } = await supabase
    .from('plan_sessions')
    .insert({ plan_id: planId, label, name, sort_order: sortOrder })
    .select()
    .single()
  if (error || !data) fail('Could not add session', error)
  return { ...data, plan_exercises: [] }
}

export async function updateSession(id: string, changes: Partial<Pick<PlanSession, 'label' | 'name' | 'weekday' | 'coach_note' | 'sort_order'>>) {
  const { error } = await supabase.from('plan_sessions').update(changes).eq('id', id)
  if (error) fail('Could not save session', error)
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from('plan_sessions').delete().eq('id', id)
  if (error) fail('Could not delete session', error)
}

export function defaultTargets(logType: LogType) {
  switch (logType) {
    case 'weight_reps':
      return { sets: 3, target_reps: 10, target_seconds: null, target_distance_km: null, rest_seconds: 90 }
    case 'reps':
      return { sets: 3, target_reps: 12, target_seconds: null, target_distance_km: null, rest_seconds: 60 }
    case 'time':
      return { sets: 3, target_reps: null, target_seconds: 45, target_distance_km: null, rest_seconds: 45 }
    case 'time_distance':
      return { sets: 1, target_reps: null, target_seconds: 600, target_distance_km: null, rest_seconds: 0 }
  }
}

export async function addPlanExercise(sessionId: string, exercise: Exercise, sortOrder: number) {
  const { error } = await supabase.from('plan_exercises').insert({
    session_id: sessionId,
    exercise_id: exercise.id,
    sort_order: sortOrder,
    ...defaultTargets(exercise.log_type),
  })
  if (error) fail('Could not add exercise', error)
}

export async function updatePlanExercise(
  id: string,
  changes: Partial<Pick<PlanExercise, 'sets' | 'target_reps' | 'target_seconds' | 'target_distance_km' | 'rest_seconds' | 'note' | 'sort_order'>>
) {
  const { error } = await supabase.from('plan_exercises').update(changes).eq('id', id)
  if (error) fail('Could not save exercise', error)
}

export async function deletePlanExercise(id: string) {
  const { error } = await supabase.from('plan_exercises').delete().eq('id', id)
  if (error) fail('Could not remove exercise', error)
}

export async function reorderPlanExercises(orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from('plan_exercises').update({ sort_order: i }).eq('id', id))
  )
  const bad = results.find((r) => r.error)
  if (bad?.error) fail('Could not reorder', bad.error)
}

// ── Client: plan, logs, history ──────────────────────────────────────────────

export async function getActivePlan(clientId: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select(PLAN_SELECT)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) fail('Could not load your plan', error)
  return data ? normalisePlan(data) : null
}

export async function getLogs(clientId: string, limit = 30): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load your workouts', error)
  return (data || []).map((l) => ({ ...l, total_volume_kg: num(l.total_volume_kg) })) as WorkoutLog[]
}

export async function getSetsForLog(logId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase.from('workout_sets').select('*').eq('log_id', logId).order('completed_at')
  if (error) fail('Could not load sets', error)
  return (data || []).map(normaliseSet)
}

export interface ExerciseHistory {
  /** best score per exercise, from completed workouts only */
  best: Record<string, number>
  /** most recent completed workout's sets per exercise, and its feel */
  last: Record<string, { sets: WorkoutSet[]; feel: Feel | null }>
}

export async function getExerciseHistory(clientId: string, exercises: Exercise[]): Promise<ExerciseHistory> {
  const ids = exercises.map((e) => e.id)
  if (!ids.length) return { best: {}, last: {} }
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*, log:workout_logs!inner(status, completed_at, feel)')
    .eq('client_id', clientId)
    .in('exercise_id', ids)
    .eq('log.status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(2000)
  if (error) fail('Could not load your history', error)

  const byExercise = new Map<string, (WorkoutSet & { log: { completed_at: string; feel: Feel | null } })[]>()
  for (const raw of data || []) {
    const set = { ...normaliseSet(raw), log: raw.log as { completed_at: string; feel: Feel | null } }
    byExercise.set(set.exercise_id, [...(byExercise.get(set.exercise_id) || []), set])
  }

  const best: ExerciseHistory['best'] = {}
  const last: ExerciseHistory['last'] = {}
  for (const ex of exercises) {
    const sets = byExercise.get(ex.id) || []
    if (!sets.length) continue
    best[ex.id] = bestScore(ex.log_type, sets) ?? 0
    const lastLogId = sets[0].log_id
    last[ex.id] = {
      sets: sets.filter((s) => s.log_id === lastLogId).sort((a, b) => a.set_number - b.set_number),
      feel: sets[0].log.feel,
    }
  }
  return { best, last }
}

export async function getIdentityStatement(clientId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('identity_cards')
    .select('identity_statement')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) return null // the identity moment is a nice-to-have; never block a workout on it
  return data?.identity_statement?.trim() || null
}

/** Continue today's unfinished workout of this session, or start a new one. */
export async function startOrResumeLog(clientId: string, planId: string, session: PlanSession): Promise<{ log: WorkoutLog; sets: WorkoutSet[] }> {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  const { data: open, error: openError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('client_id', clientId)
    .eq('session_id', session.id)
    .eq('status', 'in_progress')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (openError) fail('Could not start your workout', openError)
  if (open) return { log: open as WorkoutLog, sets: await getSetsForLog(open.id) }

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ client_id: clientId, plan_id: planId, session_id: session.id, session_name: `${session.name}` })
    .select()
    .single()
  if (error || !data) fail('Could not start your workout', error)
  return { log: data as WorkoutLog, sets: [] }
}

export async function saveSet(set: Omit<WorkoutSet, 'id' | 'completed_at'>): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from('workout_sets')
    .upsert({ ...set, completed_at: new Date().toISOString() }, { onConflict: 'log_id,exercise_id,set_number' })
    .select()
    .single()
  if (error || !data) fail('Could not save that set', error)
  return normaliseSet(data)
}

export async function finishLog(logId: string, durationSeconds: number, totalVolumeKg: number) {
  const { error } = await supabase
    .from('workout_logs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round(durationSeconds),
      total_volume_kg: Math.round(totalVolumeKg * 10) / 10,
    })
    .eq('id', logId)
  if (error) fail('Could not finish your workout', error)
}

export async function setFeel(logId: string, feel: Feel) {
  const { error } = await supabase.from('workout_logs').update({ feel }).eq('id', logId)
  if (error) fail('Could not save how it felt', error)
}

export async function reportPain(clientId: string, logId: string | null, exerciseId: string, note: string) {
  const res = await fetch('/api/workouts/pain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, logId, exerciseId, note }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not send that to your coach')
  return json as { coachNotified: boolean }
}

// ── Coach: per-client view ───────────────────────────────────────────────────

export async function getPainFlags(clientId?: string): Promise<PainFlag[]> {
  let query = supabase.from('workout_pain_flags').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) fail('Could not load pain reports', error)
  return (data || []) as PainFlag[]
}

export async function resolvePainFlag(id: string) {
  const { error } = await supabase.from('workout_pain_flags').update({ resolved: true }).eq('id', id)
  if (error) fail('Could not mark resolved', error)
}

export async function sendHighFive(logId: string) {
  const { error } = await supabase.from('workout_logs').update({ coach_high_five: true }).eq('id', logId)
  if (error) fail('Could not send the high-five', error)
}
