import type { MealType, PlateItem } from '@/lib/validation/plate'

// PEAK Plate — maths shared by the page (instant portion edits) and the API
// (which recomputes from the stored per-unit values, never trusting the phone).

export const DAILY_SCAN_LIMIT = 15

export interface PlateTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
}

export const EMPTY_TOTALS: PlateTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 }

const r1 = (n: number) => Math.round(n * 10) / 10

export function totalsFor(items: PlateItem[], quantities?: number[]): PlateTotals {
  const t = { ...EMPTY_TOTALS }
  items.forEach((item, i) => {
    const q = quantities?.[i] ?? item.quantity
    t.calories += item.per_unit.calories * q
    t.protein_g += item.per_unit.protein_g * q
    t.carbs_g += item.per_unit.carbs_g * q
    t.fat_g += item.per_unit.fat_g * q
    t.fibre_g += item.per_unit.fibre_g * q
  })
  return {
    calories: Math.round(t.calories),
    protein_g: r1(t.protein_g),
    carbs_g: r1(t.carbs_g),
    fat_g: r1(t.fat_g),
    fibre_g: r1(t.fibre_g),
  }
}

export function sumTotals(rows: Partial<PlateTotals>[]): PlateTotals {
  return rows.reduce<PlateTotals>(
    (acc, r) => ({
      calories: acc.calories + Number(r.calories || 0),
      protein_g: r1(acc.protein_g + Number(r.protein_g || 0)),
      carbs_g: r1(acc.carbs_g + Number(r.carbs_g || 0)),
      fat_g: r1(acc.fat_g + Number(r.fat_g || 0)),
      fibre_g: r1(acc.fibre_g + Number(r.fibre_g || 0)),
    }),
    { ...EMPTY_TOTALS }
  )
}

export type Verdict = 'peak' | 'good' | 'fix'

// One rule for the label, so the score and the verdict can never disagree.
export function verdictFromScore(score: number): Verdict {
  if (score >= 8) return 'peak'
  if (score >= 5) return 'good'
  return 'fix'
}

export const VERDICT_META: Record<Verdict, { label: string; emoji: string; color: string; bg: string }> = {
  peak: { label: 'PEAK Meal', emoji: '✅', color: '#059669', bg: '#ecfdf5' },
  good: { label: 'Almost there', emoji: '🟡', color: '#b45309', bg: '#fffbeb' },
  fix: { label: 'Needs a fix', emoji: '🔴', color: '#dc2626', bg: '#fef2f2' },
}

// Best guess from the India-time hour; the person can change it.
export function mealTypeForNow(date: Date = new Date()): MealType {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(date)
  )
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 19) return 'snack'
  return 'dinner'
}

export function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(1).replace(/\.0$/, '')
}

// A meal_logs row as the page receives it.
export interface MealLog extends PlateTotals {
  id: string
  meal_date: string
  meal_type: MealType
  source: 'photo' | 'text'
  title: string
  emoji: string
  items: PlateItem[]
  score: number
  verdict: Verdict
  headline: string | null
  flags: { label: string; detail: string }[]
  swaps: { change: string; impact: string }[]
  assumptions: string | null
  confidence: 'high' | 'medium' | 'low' | null
  logged: boolean
  logged_at: string | null
}
