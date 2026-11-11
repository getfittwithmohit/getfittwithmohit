// Targets used to show the client how they did. The XP for hitting them is
// awarded in the database (gfm_xp_events in supabase/daily_checkins_and_xp.sql)
// — keep these numbers in step with that file.
export const DAILY_TARGETS = {
  steps: 8000,
  sleepHours: 7,
  waterLitres: 3,
  nutrition: 8,
} as const

// Levels by all-time XP. Names follow the identity a client is building.
export const XP_LEVELS = [
  { min: 0, name: 'Starter' },
  { min: 500, name: 'Committed' },
  { min: 1500, name: 'Disciplined' },
  { min: 3000, name: 'Relentless' },
  { min: 6000, name: 'Elite' },
  { min: 10000, name: 'Legend' },
] as const

export function levelFor(xp: number) {
  let index = 0
  XP_LEVELS.forEach((level, i) => {
    if (xp >= level.min) index = i
  })
  const current = XP_LEVELS[index]
  const next = XP_LEVELS[index + 1] || null
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1
  return { number: index + 1, name: current.name, next, progress: Math.max(0, Math.min(1, progress)) }
}
