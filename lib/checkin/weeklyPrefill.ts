import type { DailyCheckin } from '@/lib/supabase/queries/dailyCheckin'
import type { CheckinFormData } from '@/lib/types/forms'

// Turns the last 7 days of daily check-ins into weekly check-in answers, so
// clients confirm their week instead of recalling it from memory.

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function prefillFromDaily(days: DailyCheckin[]): Partial<CheckinFormData> {
  if (!days.length) return {}
  const out: Partial<CheckinFormData> = {}

  const trained = days.filter((d) => d.workout_status === 'done' || d.workout_status === 'modified').length
  out.workouts_completed = String(Math.min(6, trained))

  const nutrition = avg(days.map((d) => d.nutrition_score).filter((n): n is number => n != null))
  if (nutrition !== null) out.nutrition_adherence = String(Math.round(nutrition))

  const steps = avg(days.map((d) => d.steps).filter((n): n is number => n != null))
  if (steps !== null) out.daily_steps = String(Math.round(steps))

  const energy = avg(days.map((d) => d.energy).filter((n): n is number => n != null))
  if (energy !== null) out.energy_level = String(Math.round(energy))

  const sleep = avg(days.map((d) => d.sleep_hours).filter((n): n is number => n != null))
  if (sleep !== null) {
    out.sleep_duration = sleep < 5 ? 'Less than 5 hours' : sleep < 6 ? '5–6 hours' : sleep < 7 ? '6–7 hours' : sleep < 8 ? '7–8 hours' : '8+ hours'
  }

  const quality = avg(days.map((d) => d.sleep_quality).filter((n): n is number => n != null))
  if (quality !== null) {
    out.sleep_quality = quality <= 4 ? 'Poor' : quality <= 6 ? 'Average' : quality <= 8 ? 'Good' : 'Excellent'
  }

  const water = avg(days.map((d) => d.water_litres).filter((n): n is number => n != null))
  if (water !== null) {
    out.water_intake = water < 1 ? 'Less than 1 litre' : water < 2 ? '1–2 litres' : water < 3 ? '2–3 litres' : '3 litres+'
  }

  return out
}
