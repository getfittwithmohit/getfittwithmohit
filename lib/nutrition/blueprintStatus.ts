// One place that decides a client's starting nutrition targets — used by the
// coach Nutrition tab AND the AI plan draft, so they can never disagree.
// Always returns WHY there's no Fat Loss Blueprint, never a vague "missing".
import { generateBlueprint, isHeightPlausible } from '@/lib/utils/blueprint'
import type { PlanTargets } from '@/lib/nutrition/plan'

export type BlueprintStatus =
  | { kind: 'blueprint'; targets: PlanTargets }
  | { kind: 'maintenance'; targets: PlanTargets; idealWeightKg: number; weightKg: number }
  | { kind: 'no-height' }
  | { kind: 'bad-height'; heightInches: number }
  | { kind: 'no-weight' }

type MetricsRow = { height_inches?: number | string | null; weight_kg?: number | string | null }

const pos = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0 }

/**
 * rows: the client's body_metrics rows, oldest first.
 * checkinWeight: latest weekly check-in weight, if any.
 */
export function blueprintStatusFrom(rows: MetricsRow[], checkinWeight: unknown, gender: string | null): BlueprintStatus {
  // Oldest row that has a height (onboarding / Profile); weight: latest check-in, else onboarding.
  const height = pos(rows.find((r) => pos(r.height_inches))?.height_inches)
  const weight = pos(checkinWeight) || pos(rows.find((r) => pos(r.weight_kg))?.weight_kg)

  if (!height) return { kind: 'no-height' }
  if (!isHeightPlausible(height)) return { kind: 'bad-height', heightInches: height }
  if (!weight) return { kind: 'no-weight' }

  const bp = generateBlueprint(weight, height, gender)
  if (bp.notApplicable) {
    // Already at/below ideal weight — no fat-loss deficit. Start at maintenance instead.
    const kcal = Math.round(weight * 30)
    const protein_g = Math.round(weight * 1.6)
    const fat_g = Math.round(weight * 0.8)
    const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4))
    return {
      kind: 'maintenance',
      idealWeightKg: bp.idealWeightKg,
      weightKg: weight,
      targets: { kcal, protein_g, carbs_g, fat_g, fibre_g: Math.round((kcal / 1000) * 14), water_l: 3 },
    }
  }
  return {
    kind: 'blueprint',
    targets: {
      kcal: Math.max(1200, bp.calories),
      protein_g: bp.proteinG,
      carbs_g: bp.carbsG,
      fat_g: bp.fatsG,
      fibre_g: bp.fiberG,
      water_l: 3,
    },
  }
}
