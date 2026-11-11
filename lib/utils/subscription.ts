import { addDaysIST, todayIST } from '@/lib/utils/istDate'

// Single place that decides when a client's subscription ends.
//
//   1. A custom end date set by the coach (renewals, pauses, odd lengths), else
//   2. start date + programme length in weeks.
//
// Returns null for clients with no start date yet (still onboarding).

export interface SubscriptionFields {
  start_date?: string | null
  program_duration_weeks?: number | null
  subscription_end_date?: string | null
}

export const RENEWAL_WINDOW_DAYS = 14
export const RENEWAL_URGENT_DAYS = 7

const dateOnly = (value: string) => value.slice(0, 10)

export function subscriptionEndDate(c: SubscriptionFields): string | null {
  if (c.subscription_end_date) return dateOnly(c.subscription_end_date)
  if (!c.start_date) return null
  const weeks = c.program_duration_weeks || 12
  // Last day of the final week
  return addDaysIST(dateOnly(c.start_date), weeks * 7 - 1)
}

export function daysBetween(from: string, to: string): number {
  const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
  return Math.round((toUtc(to) - toUtc(from)) / 86400000)
}

export function daysLeft(c: SubscriptionFields, today: string = todayIST()): number | null {
  const end = subscriptionEndDate(c)
  return end ? daysBetween(today, end) : null
}

// Programme length that covers the client up to the given end date. Kept in
// step with the end date so weekly review calls and "Week X of Y" keep running
// for renewed clients.
export function weeksToCover(startDate: string | null | undefined, endDate: string): number | null {
  if (!startDate) return null
  const days = daysBetween(dateOnly(startDate), endDate) + 1
  return Math.max(1, Math.ceil(days / 7))
}
