// Which meal is "now"? Meal times are free text set by the coach
// ("8:30 am", "1:30 pm", "13:30"). Pure functions.

import type { PlanMeal } from './plan'

// Minutes after midnight, or null if the text isn't a time.
export function parseMealTime(text: string | null | undefined): number | null {
  const m = (text || '').trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] || 0)
  const ap = m[3]?.[0]
  if (h > 23 || min > 59) return null
  if (ap === 'p' && h < 12) h += 12
  if (ap === 'a' && h === 12) h = 0
  return h * 60 + min
}

// The meal to show first: the first one not yet 90 minutes past its time.
// -1 when the day's last meal is well past (evening: show the catch-up).
export const MEAL_GRACE_MIN = 90
export function currentMealIndex(meals: Pick<PlanMeal, 'time'>[], nowMin: number): number {
  if (!meals.length) return -1
  const times = meals.map((m) => parseMealTime(m.time))
  if (times.every((t) => t === null)) return 0
  for (let i = 0; i < meals.length; i++) {
    const t = times[i]
    if (t === null) continue
    if (nowMin <= t + MEAL_GRACE_MIN) return i
  }
  return -1
}

export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes()
