// Simple linear regression — returns a trendline array matching input length
export function linearRegression(values: (number | null)[]): (number | null)[] {
  const points = values
    .map((v, i) => (v !== null && v !== undefined ? { x: i, y: v } : null))
    .filter((p): p is { x: number; y: number } => p !== null)

  if (points.length < 2) return values.map(() => null)

  const n = points.length
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return values.map(() => null)

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  return values.map((_, i) => parseFloat((slope * i + intercept).toFixed(2)))
}