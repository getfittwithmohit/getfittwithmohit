import { supabase } from '@/lib/supabase/client'
import { linearRegression } from '@/lib/utils/regression'
import { detectMilestones } from '@/lib/utils/milestones'

const MAX_REASONABLE_STEPS = 50000

export async function getTransformationReport(clientId: string) {
  const [clientRes, checkinsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('full_name, gender, start_date, current_week, phase, body_metrics(weight_kg, target_weight_kg, primary_goal)')
      .eq('id', clientId)
      .single(),

    supabase
      .from('weekly_checkins')
      .select('week_number, submitted_at, weight_kg, daily_steps, workouts_completed, nutrition_adherence, energy_level, sleep_quality, stress_level')
      .eq('client_id', clientId)
      .order('week_number', { ascending: true }),
  ])

  const client = clientRes.data as any

  const toNum = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) ? n : null
  }

  const rawCheckins = (checkinsRes.data || [])
    .map((c: any) => ({
      week_number: toNum(c.week_number),
      submitted_at: c.submitted_at,
      weight_kg: toNum(c.weight_kg),
      daily_steps: toNum(c.daily_steps),
      workouts_completed: toNum(c.workouts_completed),
      nutrition_adherence: toNum(c.nutrition_adherence),
      energy_level: toNum(c.energy_level),
      sleep_quality: c.sleep_quality,
      stress_level: toNum(c.stress_level),
    }))
    .filter((c) => c.week_number !== null && c.week_number > 0)

  if (!client || !rawCheckins.length) {
    return null
  }

  const checkins = rawCheckins.map((c) => ({
    ...c,
    daily_steps:
      c.daily_steps !== null && c.daily_steps <= MAX_REASONABLE_STEPS ? c.daily_steps : null,
  }))

  // True onboarding weight — the real Day 0 measurement, separate from check-ins
  const bodyMetricsWeight: number | null = toNum(client.body_metrics?.[0]?.weight_kg)

  const latestCheckin = checkins[checkins.length - 1]
  const currentWeight: number | null = latestCheckin?.weight_kg || null

  // Start weight always means the true onboarding weight when we have it.
  // Falls back to the first check-in only if onboarding weight was never captured.
  const startWeight: number | null = bodyMetricsWeight ?? checkins[0]?.weight_kg ?? null

  const totalChange: number | null = startWeight !== null && currentWeight !== null
    ? parseFloat((startWeight - currentWeight).toFixed(2))
    : null

  const totalCheckins: number = checkins.length

  // Programme duration — use the client's real start_date (set when the coach
  // started their programme) rather than just the span between check-in dates,
  // which breaks down to "0 days" when only one check-in exists so far.
  const allDates = checkins
    .map((c) => new Date(c.submitted_at))
    .filter((d) => !isNaN(d.getTime()))

  const earliestCheckinDate = allDates.length
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date(checkins[0].submitted_at)

  const programmeStartDate = client.start_date ? new Date(client.start_date) : null
  const firstDate = programmeStartDate && !isNaN(programmeStartDate.getTime())
    ? programmeStartDate
    : earliestCheckinDate

  const lastDate = allDates.length
    ? new Date(Math.max(...allDates.map((d) => d.getTime())))
    : new Date(latestCheckin.submitted_at)

  const durationDays: number = Math.max(
    1,
    Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const adherenceScores: number[] = checkins
    .map((c) => c.nutrition_adherence)
    .filter((v): v is number => v !== null && v !== undefined)
  const onPlanCount: number = adherenceScores.filter((v) => v >= 7).length
  const mealCompliancePct: number | null = adherenceScores.length
    ? Math.round((onPlanCount / adherenceScores.length) * 100 * 10) / 10
    : null

  const stepValues: number[] = checkins
    .map((c) => c.daily_steps)
    .filter((v): v is number => v !== null && v !== undefined)
  const avgSteps: number | null = stepValues.length
    ? Math.round(stepValues.reduce((a, b) => a + b, 0) / stepValues.length)
    : null

  const totalWorkouts: number = checkins.reduce((sum, c) => sum + (c.workouts_completed || 0), 0)

  // Checkin-only labels — used by Steps and Lifestyle tabs (unchanged shape)
  const weekLabels: string[] = checkins.map((c) => `Wk ${c.week_number}`)

  // Weight tab gets its own label/series set, prepended with the true "Start" point
  const checkinWeightSeries: (number | null)[] = checkins.map((c) => c.weight_kg)
  const weightChartLabels: string[] = bodyMetricsWeight !== null
    ? ['Start', ...weekLabels]
    : weekLabels
  const weightSeries: (number | null)[] = bodyMetricsWeight !== null
    ? [bodyMetricsWeight, ...checkinWeightSeries]
    : checkinWeightSeries
  const weightTrend = linearRegression(weightSeries)

  const stepsSeries: (number | null)[] = checkins.map((c) => c.daily_steps)
  const stepsTrend = linearRegression(stepsSeries)
  const week1AvgSteps: number | null = stepsSeries[0] || null
  const latestAvgSteps: number | null = stepsSeries[stepsSeries.length - 1] || null

  const SLEEP_QUALITY_MAP: Record<string, number> = {
    Poor: 3, Average: 5, Good: 7, Excellent: 9,
  }
  const energySeries: (number | null)[] = checkins.map((c) => c.energy_level)
  const sleepSeries: (number | null)[] = checkins.map((c) =>
    typeof c.sleep_quality === 'number'
      ? c.sleep_quality
      : SLEEP_QUALITY_MAP[c.sleep_quality as string] ?? null
  )
  const stressSeries: (number | null)[] = checkins.map((c) => c.stress_level)

  const avg = (arr: (number | null)[]): number | null => {
    const valid = arr.filter((v): v is number => v !== null && v !== undefined)
    return valid.length ? parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2)) : null
  }

  const avgEnergy: number | null = avg(energySeries)
  const avgSleep: number | null = avg(sleepSeries)
  const avgStress: number | null = avg(stressSeries)

  const workoutsPct: number = Math.min(100, (totalWorkouts / (totalCheckins * 5)) * 100)
  const stepsPct: number = avgSteps !== null ? Math.min(100, (avgSteps / 12000) * 100) : 0
  const sleepPct: number = avgSleep !== null ? (avgSleep / 10) * 100 : 0
  const mealPlanPct: number = mealCompliancePct !== null ? mealCompliancePct : 0

  const compliance: {
    mealPlan: { value: string; pct: number }
    workouts: { value: string; pct: number }
    steps: { value: string; pct: number }
    sleep: { value: string; pct: number }
  } = {
    mealPlan: { value: `${onPlanCount}/${adherenceScores.length} days`, pct: mealPlanPct },
    workouts: { value: `${totalWorkouts} sessions`, pct: workoutsPct },
    steps: { value: avgSteps !== null ? `${avgSteps.toLocaleString()} avg` : '–', pct: stepsPct },
    sleep: { value: avgSleep !== null ? `${avgSleep.toFixed(1)}/10 avg` : '–', pct: sleepPct },
  }

  const milestones = detectMilestones(
    checkins.map((c) => ({
      week_number: c.week_number as number,
      weight_kg: c.weight_kg,
      energy_level: c.energy_level,
      daily_steps: c.daily_steps,
      submitted_at: c.submitted_at,
    })),
    startWeight
  )

  return {
    clientName: client.full_name as string,
    startDate: firstDate,
    endDate: lastDate,
    durationDays,
    startWeight,
    currentWeight,
    totalChange,
    totalCheckins,
    mealCompliancePct,
    avgSteps,
    totalWorkouts,
    weekLabels,
    weightChartLabels,
    weightSeries,
    weightTrend,
    stepsSeries,
    stepsTrend,
    week1AvgSteps,
    latestAvgSteps,
    energySeries,
    sleepSeries,
    stressSeries,
    avgEnergy,
    avgSleep,
    avgStress,
    compliance,
    milestones,
  }
}

export type TransformationReportData = NonNullable<Awaited<ReturnType<typeof getTransformationReport>>>;