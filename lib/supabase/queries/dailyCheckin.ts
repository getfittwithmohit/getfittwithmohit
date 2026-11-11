import { supabase } from '@/lib/supabase/client'
import type { DailyCheckinInput } from '@/lib/validation/dailyCheckin'

export interface DailyCheckin extends DailyCheckinInput {
  id: string
  client_id: string
  checkin_date: string
  support_resolved: boolean
  submitted_at: string
  updated_at: string
}

export interface XpEvent {
  event_date: string
  source: string
  points: number
}

export interface LeaderboardRow {
  rank: number
  client_id: string
  display_name: string
  xp: number
  is_me: boolean
  is_hidden: boolean
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message || 'unknown error'}`)
}

// numeric columns come back from PostgREST as strings — normalise them
function normalise(row: Record<string, unknown>): DailyCheckin {
  return {
    ...(row as unknown as DailyCheckin),
    sleep_hours: Number(row.sleep_hours),
    water_litres: Number(row.water_litres),
  }
}

export async function getDailyCheckins(clientId: string, fromDate: string): Promise<DailyCheckin[]> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('client_id', clientId)
    .gte('checkin_date', fromDate)
    .order('checkin_date', { ascending: false })
  if (error) fail('Could not load check-ins', error)
  return (data || []).map(normalise)
}

export async function getAllDailyCheckinsOn(date: string): Promise<DailyCheckin[]> {
  const { data, error } = await supabase.from('daily_checkins').select('*').eq('checkin_date', date)
  if (error) fail('Could not load check-ins', error)
  return (data || []).map(normalise)
}

export async function getOpenSupportRequests(): Promise<DailyCheckin[]> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('support_needed', true)
    .eq('support_resolved', false)
    .order('checkin_date', { ascending: false })
  if (error) fail('Could not load support requests', error)
  return (data || []).map(normalise)
}

export async function resolveSupportRequest(checkinId: string) {
  const { error } = await supabase.from('daily_checkins').update({ support_resolved: true }).eq('id', checkinId)
  if (error) fail('Could not mark as resolved', error)
}

export async function getLastCheckinDates(): Promise<Record<string, string>> {
  // One small row per client: their most recent check-in date
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('client_id, checkin_date')
    .order('checkin_date', { ascending: false })
    .limit(5000)
  if (error) fail('Could not load check-ins', error)
  const latest: Record<string, string> = {}
  for (const row of data || []) {
    if (!latest[row.client_id]) latest[row.client_id] = row.checkin_date
  }
  return latest
}

export async function submitDailyCheckin(clientId: string, date: string, answers: DailyCheckinInput) {
  const res = await fetch('/api/daily-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, date, answers }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not save your check-in. Please try again.')
  return json as { checkin: DailyCheckin; onTime: boolean; coachNotified: boolean | null }
}

export async function getClientXp(clientId: string): Promise<XpEvent[]> {
  const { data, error } = await supabase.rpc('gfm_client_xp', { p_client_id: clientId })
  if (error) fail('Could not load XP', error)
  return (data || []) as XpEvent[]
}

export async function getLeaderboard(period: 'week' | 'all'): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('gfm_leaderboard', { p_period: period })
  if (error) fail('Could not load the leaderboard', error)
  return (data || []) as LeaderboardRow[]
}

export async function setLeaderboardHidden(clientId: string, hidden: boolean) {
  const { error } = await supabase.from('clients').update({ leaderboard_hidden: hidden }).eq('id', clientId)
  if (error) fail('Could not update leaderboard visibility', error)
}
