export type LogType = 'weight_reps' | 'reps' | 'time' | 'time_distance'
export type Location = 'gym' | 'home' | 'hotel'
export type Feel = 'easy' | 'right' | 'brutal'

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Legs', 'Glutes', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full body', 'Mobility',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const LOG_TYPE_LABEL: Record<LogType, string> = {
  weight_reps: 'kg × reps',
  reps: 'reps',
  time: 'time',
  time_distance: 'time + distance',
}

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  equipment: string
  locations: Location[]
  log_type: LogType
  video_url: string | null
  cues: string[]
  weight_step: number
  home_alt_id: string | null
  hotel_alt_id: string | null
  is_active: boolean
  created_at: string
}

export interface PlanExercise {
  id: string
  session_id: string
  exercise_id: string
  sort_order: number
  sets: number
  target_reps: number | null
  target_seconds: number | null
  target_distance_km: number | null
  rest_seconds: number
  note: string | null
  exercise?: Exercise
}

export interface PlanSession {
  id: string
  plan_id: string
  label: string
  name: string
  sort_order: number
  weekday: number | null // 1 = Monday … 7 = Sunday
  coach_note: string | null
  plan_exercises: PlanExercise[]
}

export interface WorkoutPlan {
  id: string
  client_id: string | null
  name: string
  schedule_type: 'rolling' | 'weekdays'
  sessions_per_week: number
  start_date: string | null
  weeks: number | null
  progression_enabled: boolean
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  plan_sessions: PlanSession[]
}

export interface WorkoutLog {
  id: string
  client_id: string
  plan_id: string | null
  session_id: string | null
  session_name: string
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  total_volume_kg: number | null
  feel: Feel | null
  coach_high_five: boolean
}

export interface WorkoutSet {
  id: string
  log_id: string
  client_id: string
  exercise_id: string
  plan_exercise_id: string | null
  set_number: number
  weight_kg: number | null
  reps: number | null
  seconds: number | null
  distance_km: number | null
  is_pr: boolean
  completed_at: string
}

export interface PainFlag {
  id: string
  client_id: string
  log_id: string | null
  exercise_id: string | null
  note: string | null
  resolved: boolean
  created_at: string
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
