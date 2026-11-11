// Calendar dates in India time (Asia/Kolkata), as 'YYYY-MM-DD'.
//
// Use these instead of new Date().toISOString().split('T')[0], which gives the
// UTC date: between midnight and 5:30 AM in India that is still "yesterday",
// so anything done then was being saved against the wrong day.

const IST_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function istDate(date: Date = new Date()): string {
  return IST_FORMAT.format(date) // en-CA formats as YYYY-MM-DD
}

export function todayIST(): string {
  return istDate()
}

// Adds whole days to a 'YYYY-MM-DD' date string.
export function addDaysIST(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  return utc.toISOString().slice(0, 10)
}

export function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}
