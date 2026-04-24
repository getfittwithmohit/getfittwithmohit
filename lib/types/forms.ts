// Onboarding form — section by section
export interface PersonalData {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  city: string
  occupation: string
}

export interface MetricsData {
  height_inches: string
  weight_kg: string
  age: string
  waist_inches: string
  chest_inches: string
  hip_inches: string
  primary_goal: string
  target_weight_kg: string
}

export interface MedicalData {
  conditions: string[]
  injuries: string
  medications: string
  recent_surgery: string
  doctors_care: string
}

export interface FitnessData {
  fitness_level: string
  environments: string[]
  training_days: string
  session_duration: string
  current_activities: string
}

export interface LifestyleData {
  sleep_duration: string
  sleep_quality: string
  stress_level: string
  stress_sources: string[]
  day_in_life: string
  daily_steps: string
}

export interface NutritionData {
  diet_preference: string
  allergies: string
  disliked_foods: string
  meals_per_day: string
  eating_out_frequency: string
  digestion_issues: string[]
  water_intake: string
}

export interface HormonalData {
  cycle_regularity: string
  mood_fluctuations: string
  hormonal_conditions: string
  additional_context: string
}

export interface PsychologyData {
  previous_attempts: string
  why_didnt_last: string
  readiness_score: string
  willingness_score: string
  biggest_fear: string
  support_system: string[]
}

export interface ExpectationsData {
  success_3_months: string
  success_12_months: string
  referral_source: string
  anything_else: string
}

export interface PhotosData {
  front_photo: File | null
  side_photo: File | null
  back_photo: File | null
}

export interface BloodWorkData {
  blood_work_status: string
  report_file: File | null
}

// Complete onboarding form
export interface OnboardingFormData {
  personal: PersonalData
  metrics: MetricsData
  medical: MedicalData
  fitness: FitnessData
  lifestyle: LifestyleData
  nutrition: NutritionData
  hormonal: HormonalData
  psychology: PsychologyData
  expectations: ExpectationsData
  photos: PhotosData
  bloodWork: BloodWorkData
}

// Default empty state
export const ONBOARDING_DEFAULTS: OnboardingFormData = {
  personal: {
    first_name: '', last_name: '', date_of_birth: '',
    gender: '', phone: '', email: '', city: '', occupation: ''
  },
  metrics: {
    height_inches: '', weight_kg: '', age: '',
    waist_inches: '', chest_inches: '', hip_inches: '',
    primary_goal: '', target_weight_kg: ''
  },
  medical: {
    conditions: [], injuries: '', medications: '',
    recent_surgery: '', doctors_care: ''
  },
  fitness: {
    fitness_level: '', environments: [], training_days: '',
    session_duration: '', current_activities: ''
  },
  lifestyle: {
    sleep_duration: '', sleep_quality: '', stress_level: '',
    stress_sources: [], day_in_life: '', daily_steps: ''
  },
  nutrition: {
    diet_preference: '', allergies: '', disliked_foods: '',
    meals_per_day: '', eating_out_frequency: '',
    digestion_issues: [], water_intake: ''
  },
  hormonal: {
    cycle_regularity: '', mood_fluctuations: '',
    hormonal_conditions: '', additional_context: ''
  },
  psychology: {
    previous_attempts: '', why_didnt_last: '',
    readiness_score: '', willingness_score: '',
    biggest_fear: '', support_system: []
  },
  expectations: {
    success_3_months: '', success_12_months: '',
    referral_source: '', anything_else: ''
  },
  photos: {
    front_photo: null, side_photo: null, back_photo: null
  },
  bloodWork: {
    blood_work_status: '', report_file: null
  }
}

export interface IdentityFormData {
  surface_goal: string
  deep_why: string
  life_vision: string
  identity_person: string
  values: string[]
  obstacle: string
  identity_statement: string
  reengagement_anchor: string
  personal_commitment: string
}

export const IDENTITY_DEFAULTS: IdentityFormData = {
  surface_goal: '',
  deep_why: '',
  life_vision: '',
  identity_person: '',
  values: [],
  obstacle: '',
  identity_statement: '',
  reengagement_anchor: '',
  personal_commitment: '',
}

export interface CheckinFormData {
  // Section 1 — Metrics
  weight_kg: string
  waist_inches: string
  chest_inches: string
  hip_inches: string
  lower_belly_inches: string
  thigh_inches: string
  daily_steps: string
  health_issues: string
  other_measurement: string

  // Section 2 — Adherence
  workouts_completed: string
  workout_intensity: string
  nutrition_adherence: string
  water_intake: string
  meals_followed: string
  off_plan_foods: string

  // Section 3 — Wellbeing
  mood: string
  energy_level: string
  sleep_duration: string
  sleep_quality: string
  stress_level: string

  // Section 4 — Wins & Challenges
  wins: string[]
  wins_description: string
  challenges: string[]
  challenges_description: string
  real_life_context: string

  // Section 5 — Mindset
  mindset_answer: string
  why_connection: string
  needs_from_coach: string[]
  needs_description: string
  week_rating: string

  // Section 6 — Booking
  call_booked: boolean
}

export const CHECKIN_DEFAULTS: CheckinFormData = {
  weight_kg: '',
  waist_inches: '',
  chest_inches: '',
  hip_inches: '',
  lower_belly_inches: '',
  thigh_inches: '',
  daily_steps: '',
  health_issues: '',
  other_measurement: '',
  workouts_completed: '',
  workout_intensity: '',
  nutrition_adherence: '',
  water_intake: '',
  meals_followed: '',
  off_plan_foods: '',
  mood: '',
  energy_level: '',
  sleep_duration: '',
  sleep_quality: '',
  stress_level: '',
  wins: [],
  wins_description: '',
  challenges: [],
  challenges_description: '',
  real_life_context: '',
  mindset_answer: '',
  why_connection: '',
  needs_from_coach: [],
  needs_description: '',
  week_rating: '',
  call_booked: false,
}

export interface TestResult {
  testId: string
  parameter: string
  fields: Record<string, string>
  effort: string
  pain: string
}

export interface AssessmentFormData {
  environment: string
  results: TestResult[]
  currentTestIndex: number
}

export const ASSESSMENT_DEFAULTS: AssessmentFormData = {
  environment: '',
  results: [],
  currentTestIndex: 0,
}

export interface CoachPrefillData {
  full_name: string
  phone: string
  email: string
  start_date: string
  current_week: number
  phase: string
  starting_weight: string
  current_weight: string
  target_weight: string
  risk_status: string
  injuries: string
  what_worked: string
  what_challenged: string
}

export interface MidJourneyClientData {
  // Step 1 — Confirm metrics
  confirmed_weight: string
  waist_inches: string
  how_feeling: string

  // Step 2 — Lifestyle snapshot
  sleep_duration: string
  stress_level: string
  life_changes: string
  nutrition_adherence: string
  workout_consistency: string

  // Step 3 — Honest reflection
  biggest_challenge: string
  what_missing: string
  what_worked: string
  commitment_score: string
  next_4_weeks: string

  // Step 4 — Anything else
  anything_else: string
}

export interface MidJourneyFormData {
  coach: CoachPrefillData
  client: MidJourneyClientData
}

export const MIDJOURNEY_COACH_DEFAULTS: CoachPrefillData = {
  full_name: '',
  phone: '',
  email: '',
  start_date: '',
  current_week: 0,
  phase: '',
  starting_weight: '',
  current_weight: '',
  target_weight: '',
  risk_status: '',
  injuries: '',
  what_worked: '',
  what_challenged: '',
}

export const MIDJOURNEY_CLIENT_DEFAULTS: MidJourneyClientData = {
  confirmed_weight: '',
  waist_inches: '',
  how_feeling: '',
  sleep_duration: '',
  stress_level: '',
  life_changes: '',
  nutrition_adherence: '',
  workout_consistency: '',
  biggest_challenge: '',
  what_missing: '',
  what_worked: '',
  commitment_score: '',
  next_4_weeks: '',
  anything_else: '',
}

export interface PledgeFormData {
  full_name: string
  why_transform: string
  cost_of_inconsistency: string
  person_becoming: string
  doing_this_for: string
  agreements: string[]
}

export const PLEDGE_DEFAULTS: PledgeFormData = {
  full_name: '',
  why_transform: '',
  cost_of_inconsistency: '',
  person_becoming: '',
  doing_this_for: '',
  agreements: [],
}