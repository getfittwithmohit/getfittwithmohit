// Fat Loss Blueprint — shared calculation engine
// Used by both the client-facing report and the coach's standalone calculator,
// so the formula only ever lives in one place.
// Sanity check — a real adult height in inches falls roughly in this range.
// Values outside this are almost always a data-entry mistake — most commonly
// someone entering feet'.inches notation (e.g. "5.4" meaning 5'4") into a
// field that expects total inches (which should be 64).
// Height in this app is entered as feet.inches notation (e.g. "5.5" = 5'5"),
// not as total inches despite older field names suggesting otherwise.
// CAVEAT: this notation is ambiguous for 10/11 inches once passed through
// parseFloat — "5.10" and "5.1" both become the JS number 5.1, so 5'10" and
// 5'1" cannot be reliably distinguished by this function alone. Treat any
// client showing as exactly X.1 with caution until heights are migrated to
// two separate feet/inches fields.
export function parseHeightToInches(raw: string | number): number {
  const str = String(raw).trim()
  const [feetPart, inchPart] = str.split('.')
  const feet = parseInt(feetPart, 10) || 0
  const inches = inchPart ? parseInt(inchPart, 10) || 0 : 0
  return feet * 12 + inches
}

// Sanity check on the CONVERTED total-inches value (after parseHeightToInches),
// not the raw feet.inches input.
export function isHeightPlausible(totalInches: number): boolean {
  return totalInches >= 48 && totalInches <= 84
}
export interface BlueprintResult {
  idealWeightKg: number
  calories: number
  proteinG: number
  fatsG: number
  fiberG: number
  carbsG: number
  proteinCals: number
  fatCals: number
  carbCals: number
  caution: 'low' | 'high' | null // calorie sanity flag
  notApplicable: boolean // true if current weight is already at/below ideal
}

const MIN_SAFE_CALORIES = 1200
const MAX_SAFE_CALORIES = 4000

// Step 1 — Ideal body weight via BMI-based formula (target BMI midpoint of healthy range)
export function calcIdealWeight(heightInches: number, gender: string | null): number {
  const heightM = heightInches * 0.0254
  const targetBMI = gender === 'Female' ? 21 : 22
  return parseFloat((targetBMI * heightM * heightM).toFixed(1))
}

// Step 2 — Full macro blueprint from current weight + ideal weight
export function calcBlueprint(
  currentWeightKg: number,
  idealWeightKg: number
): BlueprintResult {
  const calories = Math.round(currentWeightKg * 22)
  const proteinG = Math.round(idealWeightKg * 1.6)
  const fatsG = Math.round(currentWeightKg * 0.6)
  const fiberG = Math.round((calories / 1000) * 14)

  const proteinCals = proteinG * 4
  const fatCals = fatsG * 9
  const remainingCals = calories - proteinCals - fatCals
  const carbsG = Math.max(0, Math.round(remainingCals / 4))
  const carbCals = carbsG * 4

  let caution: 'low' | 'high' | null = null
  if (calories < MIN_SAFE_CALORIES) caution = 'low'
  else if (calories > MAX_SAFE_CALORIES) caution = 'high'

  // Fat-loss blueprint doesn't make sense if already at/below ideal weight
  const notApplicable = currentWeightKg <= idealWeightKg

  return {
    idealWeightKg,
    calories,
    proteinG,
    fatsG,
    fiberG,
    carbsG,
    proteinCals,
    fatCals,
    carbCals,
    caution,
    notApplicable,
  }
}

// Convenience — does both steps in one call
export function generateBlueprint(
  currentWeightKg: number,
  heightInches: number,
  gender: string | null
): BlueprintResult {
  const idealWeightKg = calcIdealWeight(heightInches, gender)
  return calcBlueprint(currentWeightKg, idealWeightKg)
}