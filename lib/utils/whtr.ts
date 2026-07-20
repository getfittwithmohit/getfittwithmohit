// Waist-to-Height Ratio — primary metric, replaces nothing, adds alongside BMI's absence.
// Formula is unit-agnostic since both values are stored in inches and ratios cancel units.

export interface WHtRResult {
  ratio: number
  riskLevel: 'healthy' | 'moderate' | 'high'
  label: string
  color: string
  message: string
}

export function calcWHtR(waistInches: number, heightInches: number): WHtRResult | null {
  if (!waistInches || !heightInches) return null

  const ratio = parseFloat((waistInches / heightInches).toFixed(2))

  let riskLevel: WHtRResult['riskLevel']
  let label: string
  let color: string
  let message: string

  if (ratio < 0.5) {
    riskLevel = 'healthy'
    label = 'Healthy range'
    color = '#22c55e'
    message = 'Waist is under half of height — this is the healthy range backed by current research.'
  } else if (ratio < 0.6) {
    riskLevel = 'moderate'
    label = 'Increased risk'
    color = '#f59e0b'
    message = 'Waist is more than half of height — worth tightening focus on waist reduction.'
  } else {
    riskLevel = 'high'
    label = 'High risk'
    color = '#ef4444'
    message = 'Waist is well over half of height — this is a strong signal to prioritise fat loss around the midsection.'
  }

  return { ratio, riskLevel, label, color, message }
}