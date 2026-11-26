// Meal ticks: what a client actually ate against their plan, one row per
// plan meal per day. Pure helpers shared by the Eat tab, the daily check-in,
// Today and the coach's 7-day view.

import type { PlanMeal } from '@/lib/nutrition/plan'

export type TickStatus = 'ate' | 'else' | 'skipped'

export interface MealTick {
  tick_date: string
  meal_id: string
  meal_name: string
  status: TickStatus
  option_id: string | null
  option_title: string | null
  protein_g: number | null
  kcal: number | null
  plate_log_id: string | null
}

export const TICK_LABEL: Record<TickStatus, string> = { ate: 'Ate the plan', else: 'Something else', skipped: 'Skipped' }

export interface DaySummary {
  protein: number      // grams counted
  kcal: number
  uncounted: number    // meals eaten but with unknown protein
  ate: number
  else: number
  skipped: number
  ticked: number
  total: number        // meals on the plan
}

// Only ticks for meals still on the plan count.
export function summarise(meals: PlanMeal[], ticks: MealTick[]): DaySummary {
  const ids = new Set(meals.map((m) => m.id))
  const s: DaySummary = { protein: 0, kcal: 0, uncounted: 0, ate: 0, else: 0, skipped: 0, ticked: 0, total: meals.length }
  for (const t of ticks) {
    if (!ids.has(t.meal_id)) continue
    s[t.status]++
    s.ticked++
    if (t.status === 'skipped') continue
    if (t.protein_g == null) s.uncounted++
    else s.protein += Number(t.protein_g)
    s.kcal += t.kcal || 0
  }
  s.protein = Math.round(s.protein)
  return s
}

// Plain-language line under the protein ring. plannedLeft = protein in the
// plan's meals still to come, so the advice matches what's actually ahead.
export function proteinHint(target: number, s: DaySummary, mealsLeft: number, plannedLeft = 0): string {
  if (s.ticked === 0) return 'Tick each meal as you eat it to fill this ring.'
  const left = Math.max(0, target - s.protein)
  if (left === 0) return 'Target hit. Great eating today 💪'
  const meals = mealsLeft === 1 ? 'your last meal' : `your next ${mealsLeft} meals`
  if (mealsLeft > 0 && plannedLeft >= left * 0.9) return `${left} g to go. Eat ${meals} as planned and you’ll hit it.`
  if (mealsLeft > 0) return `${left} g to go. ${mealsLeft === 1 ? 'Your last meal gives' : 'The rest of your plan gives'} about ${Math.round(plannedLeft)} g, so add a protein side like curd, chana or paneer.`
  return `${left} g short today. A bowl of curd or a fistful of chana helps close it.`
}

// 1–10 nutrition adherence for the daily check-in, from ticks.
// Plan meal = 1, something else = 0.5, skipped = 0, averaged over the meals
// the client ticked. Needs at least half the day ticked to suggest a score.
export function checkinScore(meals: PlanMeal[], ticks: MealTick[]): number | null {
  const s = summarise(meals, ticks)
  if (!s.total || s.ticked < Math.ceil(s.total / 2)) return null
  return Math.max(1, Math.min(10, Math.round((10 * (s.ate + 0.5 * s.else)) / s.ticked)))
}

// Which meal is "next": the first meal at or after the clock's current
// meal that hasn't been ticked yet. -1 when the rest of the day is ticked.
export function nextOpenMeal(meals: PlanMeal[], clockIndex: number, ticked: Set<string>): number {
  if (clockIndex < 0) return -1
  for (let i = clockIndex; i < meals.length; i++) if (!ticked.has(meals[i].id)) return i
  return -1
}

// Coach view: a few plain observations from up to 7 days of ticks.
export function patternNotes(meals: PlanMeal[], days: { date: string; ticks: MealTick[] }[], proteinTarget: number): string[] {
  const notes: string[] = []
  const n = days.length
  const logged = days.filter((d) => d.ticks.length > 0)
  if (!n) return notes
  if (logged.length === 0) return ['No meals ticked yet this week. A nudge to tick meals in the Eat tab will light this up.']

  const perMeal = meals.map((m) => {
    const ts = days.map((d) => d.ticks.find((t) => t.meal_id === m.id)).filter(Boolean) as MealTick[]
    return { m, skipped: ts.filter((t) => t.status === 'skipped').length, off: ts.filter((t) => t.status === 'else').length }
  })
  const skip = perMeal.filter((x) => x.skipped >= 2).sort((a, b) => b.skipped - a.skipped)[0]
  if (skip) notes.push(`${skip.m.name} skipped ${skip.skipped} of ${n} days.`)
  const off = perMeal.filter((x) => x.off >= 2).sort((a, b) => b.off - a.off)[0]
  if (off) notes.push(`${off.m.name} off-plan ${off.off} of ${n} days. Worth asking what’s getting in the way.`)

  const full = logged.filter((d) => summarise(meals, d.ticks).ticked >= Math.ceil(meals.length / 2))
  if (full.length && proteinTarget) {
    const avg = Math.round(full.reduce((t, d) => t + summarise(meals, d.ticks).protein, 0) / full.length)
    const pct = Math.round((avg / proteinTarget) * 100)
    notes.push(pct >= 90
      ? `Protein on track: about ${avg} g a day (${pct}% of ${proteinTarget} g).`
      : `Protein averaging ${avg} g vs ${proteinTarget} g target (${pct}%).`)
  }
  if (logged.length < n) notes.push(`Ticked meals on ${logged.length} of ${n} days.`)
  if (notes.length === 0) notes.push('Eating to plan this week. Nothing to fix.')
  return notes.slice(0, 3)
}
