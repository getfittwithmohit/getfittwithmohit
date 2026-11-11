'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { DAILY_TARGETS } from '@/lib/constants/dailyCheckin'
import {
  getAllDailyCheckinsOn,
  getLastCheckinDates,
  getOpenSupportRequests,
  resolveSupportRequest,
  type DailyCheckin,
} from '@/lib/supabase/queries/dailyCheckin'
import { addDaysIST, formatDayLabel, istDate, todayIST } from '@/lib/utils/istDate'

type ClientLite = { id: string; full_name: string; phone: string | null }

const WORKOUT_ICON: Record<string, string> = { done: '✅', modified: '🔁', skipped: '❌' }

function daysBetween(from: string, to: string) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10))
  return Math.round((b - a) / 86400000)
}

export default function CoachDailyPage() {
  const { checking } = useAuthGuard('coach')
  const today = todayIST()

  const [date, setDate] = useState(today)
  const [clients, setClients] = useState<ClientLite[]>([])
  const [checkins, setCheckins] = useState<DailyCheckin[]>([])
  const [support, setSupport] = useState<DailyCheckin[]>([])
  const [lastDates, setLastDates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  // Fetches everything for one day; returns data instead of setting state so
  // the effect below owns all state updates.
  const fetchDay = useCallback(async (forDate: string) => {
    const [clientRes, dayRows, open, last] = await Promise.all([
      supabase.from('clients').select('id, full_name, phone, status').order('full_name'),
      getAllDailyCheckinsOn(forDate),
      getOpenSupportRequests(),
      getLastCheckinDates(),
    ])
    if (clientRes.error) throw new Error(`Could not load clients: ${clientRes.error.message}`)
    const active = (clientRes.data || []).filter((c) => (c.status || 'active') === 'active') as ClientLite[]
    return { active, dayRows, open, last }
  }, [])

  useEffect(() => {
    if (checking) return
    let cancelled = false
    fetchDay(date)
      .then(({ active, dayRows, open, last }) => {
        if (cancelled) return
        setClients(active)
        setCheckins(dayRows)
        setSupport(open)
        setLastDates(last)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [checking, date, fetchDay])

  const resolve = async (id: string) => {
    setResolving(id)
    try {
      await resolveSupportRequest(id)
      setSupport((s) => s.filter((r) => r.id !== id))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResolving(null)
    }
  }

  if (checking || loading) return <PageLoader />

  const nameOf = (id: string) => clients.find((c) => c.id === id)?.full_name || 'Former client'
  const phoneOf = (id: string) => clients.find((c) => c.id === id)?.phone || null
  const byClient = new Map(checkins.map((c) => [c.client_id, c]))
  const submitted = clients.filter((c) => byClient.has(c.id))
  const missing = clients.filter((c) => !byClient.has(c.id))
  const quiet = clients
    .map((c) => ({ ...c, last: lastDates[c.id] || null }))
    .filter((c) => !c.last || daysBetween(c.last, today) >= 2)

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => window.location.href = '/coach/dashboard'}
              className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1"
            >
              ← Dashboard
            </button>
            <h1 className="text-white text-lg font-medium">Daily Check-ins</h1>
            <p className="text-white/40 text-xs mt-0.5">
              {submitted.length} of {clients.length} active clients checked in · {formatDayLabel(date)}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/coach/dashboard/leaderboard'}
            className="text-white/60 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Support requests */}
        {support.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-red-700 mb-3">🆘 Support requests · {support.length} open</p>
            <div className="flex flex-col gap-3">
              {support.map((r) => (
                <div key={r.id} className="bg-white border border-red-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => window.location.href = `/coach/dashboard/client/${r.client_id}`}
                        className="text-sm font-medium text-[#0f172a] hover:underline"
                      >
                        {nameOf(r.client_id)}
                      </button>
                      <p className="text-xs text-[#94a3b8]">{formatDayLabel(r.checkin_date)}</p>
                      <p className="text-sm text-[#0f172a] mt-2 whitespace-pre-wrap">{r.support_message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {phoneOf(r.client_id) && (
                        <a
                          href={`https://wa.me/${phoneOf(r.client_id)!.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#16a34a] underline"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => resolve(r.id)}
                        disabled={resolving === r.id}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50"
                      >
                        {resolving === r.id ? 'Saving…' : 'Mark resolved'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gone quiet */}
        {quiet.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">⚡ No daily check-in for 2+ days</p>
            <div className="flex flex-wrap gap-2">
              {quiet.map((c) => (
                <button
                  key={c.id}
                  onClick={() => window.location.href = `/coach/dashboard/client/${c.id}`}
                  className="text-xs bg-white border border-amber-200 rounded-full px-3 py-1 text-amber-900 hover:border-amber-400"
                >
                  {c.full_name} · {c.last ? `last ${formatDayLabel(c.last)}` : 'never'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day picker */}
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDaysIST(date, -1))} className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-white">←</button>
          <p className="text-sm font-medium text-[#0f172a] min-w-[8rem] text-center">{date === today ? 'Today' : formatDayLabel(date)}</p>
          <button
            onClick={() => setDate(addDaysIST(date, 1))}
            disabled={date >= today}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-white disabled:opacity-30"
          >
            →
          </button>
        </div>

        {/* Day table */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[10px] text-[#94a3b8] uppercase tracking-wide text-left border-b border-[#e2e8f0]">
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-2 py-2.5 font-medium">Workout</th>
                <th className="px-2 py-2.5 font-medium">Nutrition</th>
                <th className="px-2 py-2.5 font-medium">Steps</th>
                <th className="px-2 py-2.5 font-medium">Sleep</th>
                <th className="px-2 py-2.5 font-medium">Energy</th>
                <th className="px-2 py-2.5 font-medium">Water</th>
                <th className="px-2 py-2.5 font-medium">🙏</th>
              </tr>
            </thead>
            <tbody>
              {submitted.map((c) => {
                const r = byClient.get(c.id)!
                const late = istDate(new Date(r.submitted_at)) !== r.checkin_date
                const red = (ok: boolean) => (ok ? '' : 'text-[#ef4444]')
                return (
                  <tr
                    key={c.id}
                    onClick={() => window.location.href = `/coach/dashboard/client/${c.id}`}
                    className={`border-b border-[#f8fafc] cursor-pointer hover:bg-[#f8fafc] ${r.support_needed ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-[#0f172a]">
                      {c.full_name}
                      {late && <span className="text-xs text-amber-600"> · late</span>}
                      {r.support_needed && <span className="text-xs"> 🆘</span>}
                    </td>
                    <td className="px-2 py-2.5" title={r.workout_note || ''}>{WORKOUT_ICON[r.workout_status]}</td>
                    <td className={`px-2 py-2.5 ${red(r.nutrition_score >= DAILY_TARGETS.nutrition)}`} title={r.nutrition_note || ''}>{r.nutrition_score}/10</td>
                    <td className={`px-2 py-2.5 ${red((r.steps ?? 0) >= DAILY_TARGETS.steps)}`}>{r.steps?.toLocaleString('en-IN') ?? '–'}</td>
                    <td className={`px-2 py-2.5 ${red((r.sleep_hours ?? 0) >= DAILY_TARGETS.sleepHours)}`}>{r.sleep_hours}h · {r.sleep_quality}/10</td>
                    <td className="px-2 py-2.5">{r.energy}/10</td>
                    <td className={`px-2 py-2.5 ${red((r.water_litres ?? 0) >= DAILY_TARGETS.waterLitres)}`}>{r.water_litres}L</td>
                    <td className="px-2 py-2.5">{r.gratitude_done ? '✓' : '–'}</td>
                  </tr>
                )
              })}
              {missing.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => window.location.href = `/coach/dashboard/client/${c.id}`}
                  className="border-b border-[#f8fafc] cursor-pointer hover:bg-[#f8fafc]"
                >
                  <td className="px-4 py-2.5 text-[#94a3b8]">{c.full_name}</td>
                  <td colSpan={7} className="px-2 py-2.5 text-xs text-[#cbd5e1]">Not checked in</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={8} className="text-center text-[#94a3b8] py-10">No active clients</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8]">Red = below target. Hover a workout or nutrition score to see the client&apos;s note; click a row for their 30-day history.</p>
      </div>
    </div>
  )
}
