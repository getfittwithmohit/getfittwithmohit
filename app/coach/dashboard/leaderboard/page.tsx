'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { getLeaderboard, setLeaderboardHidden, type LeaderboardRow } from '@/lib/supabase/queries/dailyCheckin'

type Period = 'week' | 'all'

// Coach view: every active client with full names, including hidden ones,
// with a toggle to hide or show each (e.g. hide the demo profiles).
export default function CoachLeaderboardPage() {
  const { checking } = useAuthGuard('coach')
  const [period, setPeriod] = useState<Period>('week')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (checking) return
    let cancelled = false
    getLeaderboard(period)
      .then((data) => {
        if (cancelled) return
        setRows(data)
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
  }, [checking, period, reloadKey])

  const toggle = async (row: LeaderboardRow) => {
    setBusyId(row.client_id)
    try {
      await setLeaderboardHidden(row.client_id, !row.is_hidden)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  if (checking || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.location.href = '/coach/dashboard'}
            className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-white text-lg font-medium">Leaderboard</h1>
          <p className="text-white/40 text-xs mt-0.5">Clients see first name + last initial. Hidden clients never appear to others.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        <div className="flex bg-white border border-[#e2e8f0] rounded-xl p-1 mb-4">
          {([
            { key: 'week', label: 'This week' },
            { key: 'all', label: 'All time' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === t.key ? 'bg-[#1a1f3a] text-white' : 'text-[#64748b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden divide-y divide-[#f1f5f9]">
          {rows.length === 0 && <p className="text-sm text-[#94a3b8] text-center py-10">No active clients</p>}
          {rows.map((row) => (
            <div key={row.client_id} className={`flex items-center gap-3 px-4 py-3 ${row.is_hidden ? 'opacity-50' : ''}`}>
              <span className="w-8 text-center text-sm font-semibold text-[#64748b]">{row.rank}</span>
              <button
                onClick={() => window.location.href = `/coach/dashboard/client/${row.client_id}`}
                className="flex-1 text-left text-sm text-[#0f172a] truncate hover:underline"
              >
                {row.display_name}
                {row.is_hidden && <span className="text-xs text-[#94a3b8] ml-2">hidden</span>}
              </button>
              <span className="text-sm font-semibold text-[#1a1f3a] w-20 text-right">{row.xp.toLocaleString('en-IN')} XP</span>
              <button
                onClick={() => toggle(row)}
                disabled={busyId === row.client_id}
                className="text-xs text-[#4a7fd4] underline underline-offset-2 w-10 disabled:opacity-50"
              >
                {row.is_hidden ? 'Show' : 'Hide'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
