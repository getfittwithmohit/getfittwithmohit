import { z } from 'zod'

export const personalSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select your gender'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  city: z.string().optional(),
  occupation: z.string().optional(),
})

export const metricsSchema = z.object({
  height_inches: z.string().min(1, 'Height is required'),
  weight_kg: z.string().min(1, 'Weight is required'),
  age: z.string().optional(),
  // All five sites are required: they are the baseline for inches lost
  waist_inches: z.string({ message: 'Waist is required' }).min(1, 'Waist is required'),
  chest_inches: z.string({ message: 'Chest is required' }).min(1, 'Chest is required'),
  hip_inches: z.string({ message: 'Hips are required' }).min(1, 'Hips are required'),
  lower_belly_inches: z.string({ message: 'Lower belly is required' }).min(1, 'Lower belly is required'),
  thigh_inches: z.string({ message: 'Thigh is required' }).min(1, 'Thigh is required'),
  trouser_waist_size: z.string().optional(),
  primary_goal: z.string().min(1, 'Please select your primary goal'),
  target_weight_kg: z.string().optional(),
})

export const medicalSchema = z.object({
  conditions: z.array(z.string()).optional(),
  injuries: z.string().optional(),
  medications: z.string().optional(),
  recent_surgery: z.string().optional(),
  doctors_care: z.string().optional(),
})

export const fitnessSchema = z.object({
  fitness_level: z.string().min(1, 'Please select your fitness level'),
  environments: z.array(z.string()).optional(),
  training_days: z.string().min(1, 'Please select training days'),
  session_duration: z.string().optional(),
  current_activities: z.string().optional(),
  preferred_training_time: z.string({ message: 'Please pick your best training time' }).min(1, 'Please pick your best training time'),
  fitness_tracker: z.string().optional(),
})

export const lifestyleSchema = z.object({
  sleep_duration: z.string().optional(),
  sleep_quality: z.string().optional(),
  stress_level: z.string().min(1, 'Please select your stress level'),
  stress_sources: z.array(z.string()).optional(),
  day_in_life: z.string().optional(),
  daily_steps: z.string().optional(),
  alcohol_frequency: z.string({ message: 'Please tell us how often you drink' }).min(1, 'Please tell us how often you drink'),
  smoking: z.string({ message: 'Please answer the smoking question' }).min(1, 'Please answer the smoking question'),
})

export const nutritionSchema = z.object({
  diet_preference: z.string().min(1, 'Please select your diet preference'),
  allergies: z.string().optional(),
  disliked_foods: z.string().optional(),
  meals_per_day: z.string().optional(),
  eating_out_frequency: z.string().optional(),
  digestion_issues: z.array(z.string()).optional(),
  water_intake: z.string().optional(),
})

export const hormonalSchema = z.object({
  cycle_regularity: z.string().optional(),
  mood_fluctuations: z.string().optional(),
  hormonal_conditions: z.string().optional(),
  additional_context: z.string().optional(),
})

export const psychologySchema = z.object({
  previous_attempts: z.string().optional(),
  why_didnt_last: z.string().optional(),
  readiness_score: z.string().min(1, 'Please rate your readiness'),
  willingness_score: z.string().optional(),
  biggest_fear: z.string().optional(),
  support_system: z.array(z.string()).optional(),
})

export const expectationsSchema = z.object({
  success_3_months: z.string().optional(),
  success_12_months: z.string().optional(),
  referral_source: z.string().optional(),
  anything_else: z.string().optional(),
})

// Map section number to its schema
export const sectionSchemas = {
  1: personalSchema,
  2: metricsSchema,
  3: medicalSchema,
  4: fitnessSchema,
  5: lifestyleSchema,
  6: nutritionSchema,
  7: hormonalSchema,
  8: psychologySchema,
  9: expectationsSchema,
} as const