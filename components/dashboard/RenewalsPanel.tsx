'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { levelFor } from '@/lib/constants/dailyCheckin'
import { getClientXp } from '@/lib/supabase/queries/dailyCheckin'
import { addDaysIST, formatDayLabel, todayIST } from '@/lib/utils/istDate'
import {
  RENEWAL_URGENT_DAYS,
  RENEWAL_WINDOW_DAYS,
  daysLeft,
  subscriptionEndDate,
  weeksToCover,
} from '@/lib/utils/subscription'

type RenewalClient = {
  id: string
  full_name: string
  phone: string | null
  start_date: string | null
  program_duration_weeks: number | null
  subscription_end_date: string | null
  end: string
  left: number
}

type TalkingPoints = {
  weekNow: number
  weightChange: number | null
  checkinsLast30: number
  workoutsLast30: number
  xp: number
}

// Dashboard panel: active clients whose subscription ends within 14 days (or
// has already ended), with their results for the renewal conversation and
// one-tap Renewed / Not renewing actions.
export function RenewalsPanel() {
  const [clients, setClients] = useState<RenewalClient[]>([])
  const [points, setPoints] = useState<Record<string, TalkingPoints>>({})
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [newEnd, setNewEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const today = todayIST()

    async function load() {
      const { data, error: clientError } = await supabase
        .from('clients')
        .select('id, full_name, phone, status, start_date, program_duration_weeks, subscription_end_date')
      if (clientError) throw new Error(`Could not load renewals: ${clientError.message}`)

      const due = (data || [])
        .filter((c) => (c.status || 'active') === 'active')
        .map((c) => ({ ...c, end: subscriptionEndDate(c), left: daysLeft(c, today) }))
        .filter((c): c is RenewalClient & { status: string } => c.end !== null && c.left !== null && c.left <= RENEWAL_WINDOW_DAYS)
        .sort((a, b) => a.left - b.left)

      // Results for the renewal conversation — only for the few clients due
      const since = addDaysIST(today, -29)
      const entries = await Promise.all(
        due.map(async (c) => {
          const [weekly, daily, xp] = await Promise.all([
            supabase
              .from('weekly_checkins')
              .select('weight_kg, submitted_at')
              .eq('client_id', c.id)
              .not('weight_kg', 'is', null)
              .order('submitted_at', { ascending: true }),
            supabase
              .from('daily_checkins')
              .select('workout_status')
              .eq('client_id', c.id)
              .gte('checkin_date', since),
            getClientXp(c.id).catch(() => []),
          ])
          const weights = (weekly.data || []).map((w) => Number(w.weight_kg)).filter(Number.isFinite)
          const tp: TalkingPoints = {
            weekNow: c.start_date
              ? Math.max(1, Math.floor((Date.parse(today) - Date.parse(c.start_date.slice(0, 10))) / (7 * 86400000)) + 1)
              : 1,
            weightChange: weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null,
            checkinsLast30: (daily.data || []).length,
            workoutsLast30: (daily.data || []).filter((d) => d.workout_status === 'done').length,
            xp: xp.reduce((s, e) => s + e.points, 0),
          }
          return [c.id, tp] as const
        })
      )
      return { due, points: Object.fromEntries(entries) }
    }

    load()
      .then((result) => {
        if (cancelled) return
        setClients(result.due)
        setPoints(result.points)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const renew = async (c: RenewalClient) => {
    if (!newEnd || newEnd <= c.end) {
      setError('Pick a new end date after the current one.')
      return
    }
    setBusy(true)
    setError(null)
    const weeks = weeksToCover(c.start_date, newEnd)
    const { error: saveError } = await supabase
      .from('clients')
      .update({
        subscription_end_date: newEnd,
        ...(weeks ? { program_duration_weeks: weeks } : {}),
      })
      .eq('id', c.id)
    setBusy(false)
    if (saveError) return setError(`Could not save the renewal: ${saveError.message}`)
    setOpen(null)
    setReloadKey((k) => k + 1)
  }

  const notRenewing = async (c: RenewalClient) => {
    if (!window.confirm(`Mark ${c.full_name} as not renewing? They'll be set to inactive and lose app access to content and the leaderboard.`)) return
    setBusy(true)
    setError(null)
    const { error: saveError } = await supabase.from('clients').update({ status: 'inactive' }).eq('id', c.id)
    setBusy(false)
    if (saveError) return setError(`Could not update ${c.full_name}: ${saveError.message}`)
    setReloadKey((k) => k + 1)
  }

  if (!loaded) return null
  if (!error && clients.length === 0) return null

  return (
    <div className="px-6 pt-4">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#0f172a]">
            🔔 Renewals · {clients.length} ending within {RENEWAL_WINDOW_DAYS} days
          </p>
        </div>

        {error && <p className="text-sm text-[#ef4444] px-5 py-3">{error}</p>}

        <div className="divide-y divide-[#f1f5f9]">
          {clients.map((c) => {
            const tp = points[c.id]
            const urgent = c.left <= RENEWAL_URGENT_DAYS
            const ended = c.left < 0
            const isOpen = open === c.id
            const level = tp ? levelFor(tp.xp) : null
            return (
              <div key={c.id} className={urgent ? 'bg-red-50/60' : ''}>
                <div className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    onClick={() => window.location.href = `/coach/dashboard/client/${c.id}`}
                    className="text-sm font-medium text-[#0f172a] hover:underline min-w-[9rem] text-left"
                  >
                    {c.full_name}
                  </button>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ended
                        ? 'bg-[#ef4444] text-white'
                        : urgent
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ended ? `Ended ${-c.left}d ago` : c.left === 0 ? 'Ends today' : `${c.left} days left`}
                  </span>
                  <span className="text-xs text-[#64748b]">Ends {formatDayLabel(c.end)}</span>
                  {tp && (
                    <span className="text-xs text-[#94a3b8] flex-1 min-w-[16rem]">
                      Week {tp.weekNow}
                      {tp.weightChange !== null && ` · ${tp.weightChange <= 0 ? '' : '+'}${tp.weightChange.toFixed(1)} kg`}
                      {` · ${tp.checkinsLast30}/30 check-ins · ${tp.workoutsLast30} workouts (30d)`}
                      {level && ` · ${tp.xp.toLocaleString('en-IN')} XP ${level.name}`}
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-xs ml-auto">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#16a34a] underline"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setOpen(isOpen ? null : c.id)
                        setNewEnd(addDaysIST(c.left < 0 ? todayIST() : c.end, 12 * 7))
                        setError(null)
                      }}
                      className="text-[#4a7fd4] underline"
                    >
                      Renewed
                    </button>
                    <button onClick={() => notRenewing(c)} disabled={busy} className="text-[#94a3b8] underline disabled:opacity-50">
                      Not renewing
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="text-xs text-[#64748b] block mb-1">New end date</label>
                      <input
                        type="date"
                        value={newEnd}
                        min={addDaysIST(c.end, 1)}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#00D4E8]"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {[4, 12, 24].map((w) => (
                        <button
                          key={w}
                          onClick={() => setNewEnd(addDaysIST(c.left < 0 ? todayIST() : c.end, w * 7))}
                          className="text-xs px-2.5 py-2 border border-[#e2e8f0] rounded-lg hover:border-[#00D4E8]"
                        >
                          +{w} wks
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => renew(c)}
                      disabled={busy}
                      className="bg-[#1a1f3a] text-[#00D4E8] px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : 'Save renewal'}
                    </button>
                    <p className="text-xs text-[#94a3b8] w-full">
                      Continues the same programme — history, streaks and XP carry on.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
