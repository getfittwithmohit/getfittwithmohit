import { addDaysIST, istDate } from '@/lib/utils/istDate'

interface Opened {
  opened_at: string | null
}

// Days (IST) on which the client opened at least one idea
export function openedDays(rows: Opened[]): Set<string> {
  const days = new Set<string>()
  for (const r of rows) if (r.opened_at) days.add(istDate(new Date(r.opened_at)))
  return days
}

// Consecutive days with an opened idea, ending today — or yesterday, so the
// streak doesn't look broken first thing in the morning.
export function ideaStreak(rows: Opened[], today: string): number {
  const days = openedDays(rows)
  let day = days.has(today) ? today : addDaysIST(today, -1)
  let n = 0
  while (days.has(day)) {
    n++
    day = addDaysIST(day, -1)
  }
  return n
}

// Days since the last opened idea (null = never opened one)
export function daysAway(rows: Opened[], today: string): number | null {
  const days = [...openedDays(rows)].sort()
  if (!days.length) return null
  const last = days[days.length - 1]
  const ms = new Date(`${today}T00:00:00Z`).getTime() - new Date(`${last}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000)
}

// Body text → paragraphs
export function paragraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export function greeting(hourIST: number): string {
  if (hourIST < 12) return 'Good morning'
  if (hourIST < 17) return 'Good afternoon'
  return 'Good evening'
}

export function istHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(now))
}
