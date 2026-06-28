interface CheckinPoint {
  week_number: number
  weight_kg: number | null
  energy_level: number | null
  daily_steps: number | null
  submitted_at: string
}

interface Milestone {
  week: number
  label: string
  detail: string
  color: 'blue' | 'green' | 'orange'
}

export function detectMilestones(
  checkins: CheckinPoint[],
  startWeight: number | null
): Milestone[] {
  const sorted = [...checkins]
    .filter((c) => Number.isFinite(c.week_number) && c.week_number > 0)
    .sort((a, b) => a.week_number - b.week_number)

  if (!sorted.length) return []

  const milestones: Milestone[] = []
  const colors: Milestone['color'][] = ['blue', 'green', 'orange']
  let colorIdx = 0
  const nextColor = () => colors[colorIdx++ % colors.length]

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // 1. Journey begins
  if (first.weight_kg) {
    milestones.push({
      week: first.week_number,
      label: 'Journey begins',
      detail: `${first.weight_kg} kg — committed from day one`,
      color: nextColor(),
    })
  }

  // 2. Weight milestones — every 2kg threshold crossed, direction-aware
  if (startWeight) {
    const seenThresholds = new Set<number>()
    for (const c of sorted) {
      if (!c.weight_kg) continue
      const change = startWeight - c.weight_kg
      const direction = change >= 0 ? 'lost' : 'gained'
      const absChange = Math.abs(change)
      const threshold = Math.floor(absChange / 2) * 2

      if (threshold >= 2 && !seenThresholds.has(threshold)) {
        seenThresholds.add(threshold)
        const isFirst = threshold === 2
        milestones.push({
          week: c.week_number,
          label: isFirst
            ? `First ${threshold} kg ${direction === 'lost' ? 'down' : 'up'}`
            : `${threshold} kg milestone`,
          detail: `${c.weight_kg} kg — ${
            threshold >= 5 ? `${threshold} full kg ${direction}` : 'momentum building'
          }`,
          color: nextColor(),
        })
      }
    }
  }

  // 3. Energy rising — biggest jump from baseline
  const energyPoints = sorted.filter((c) => c.energy_level !== null)
  if (energyPoints.length >= 2) {
    const baseline = energyPoints[0].energy_level!
    let bestJump = { week: 0, value: 0, diff: 0 }
    for (const c of energyPoints) {
      const diff = (c.energy_level || 0) - baseline
      if (diff > bestJump.diff) {
        bestJump = { week: c.week_number, value: c.energy_level!, diff }
      }
    }
    if (bestJump.diff >= 1 && bestJump.week > 0) {
      milestones.push({
        week: bestJump.week,
        label: 'Energy rising',
        detail: `Energy up ${baseline.toFixed(1)} → ${bestJump.value.toFixed(1)} — body adapting`,
        color: nextColor(),
      })
    }
  }

  // 4. Step count peak — only consider valid, sane step values with a real week number
  const stepPoints = sorted.filter(
    (c) => c.daily_steps !== null && c.daily_steps > 0 && Number.isFinite(c.week_number)
  )
  if (stepPoints.length >= 2) {
    const peak = stepPoints.reduce((max, c) =>
      (c.daily_steps || 0) > (max.daily_steps || 0) ? c : max
    )
    milestones.push({
      week: peak.week_number,
      label: 'Step count peaks',
      detail: `${peak.daily_steps?.toLocaleString()} avg — momentum fully activated`,
      color: nextColor(),
    })
  }

  // 5. Latest / current state
  if (last.weight_kg && last.week_number !== first.week_number) {
    const totalChange = startWeight ? (startWeight - last.weight_kg).toFixed(2) : null
    milestones.push({
      week: last.week_number,
      label: totalChange
        ? `${Math.abs(parseFloat(totalChange))} kg ${parseFloat(totalChange) >= 0 ? 'lost' : 'gained'} — current`
        : 'Current progress',
      detail: `${last.weight_kg} kg${
        last.energy_level ? ` — Energy at ${last.energy_level}/10` : ''
      } · Momentum strong`,
      color: 'green',
    })
  }

  // Final guard — drop anything that somehow still lacks a valid week, then dedupe
  const valid = milestones.filter((m) => Number.isFinite(m.week) && m.week > 0)
  const unique = valid.filter(
    (m, i, arr) => arr.findIndex((x) => x.week === m.week && x.label === m.label) === i
  )
  return unique.sort((a, b) => a.week - b.week)
}