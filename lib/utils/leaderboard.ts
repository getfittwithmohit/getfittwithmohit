import { addDaysIST, todayIST } from '@/lib/utils/istDate'

// Monday of the week containing `today` (weeks run Monday–Sunday, India time).
export function mondayOf(today: string = todayIST()): string {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return addDaysIST(today, -((dow + 6) % 7))
}

function shortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

// e.g. "Mon 9 Nov – Sun 15 Nov"
export function lastWeekLabel(today: string = todayIST()): string {
  const start = addDaysIST(mondayOf(today), -7)
  const end = addDaysIST(start, 6)
  return `Mon ${shortDate(start)} – Sun ${shortDate(end)}`
}
