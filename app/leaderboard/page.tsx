'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { HomeButton } from '@/components/layout/HomeButton'
import { levelFor } from '@/lib/constants/dailyCheckin'
import {
  getClientXp,
  getLeaderboard,
  setLeaderboardHidden,
  type LeaderboardRow,
} from '@/lib/supabase/queries/dailyCheckin'

type Period = 'week' | 'all'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const [period, setPeriod] = useState<Period>('week')
  const [boards, setBoards] = useState<Record<Period, LeaderboardRow[]>>({ week: [], all: [] })
  const [totalXp, setTotalXp] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingVisibility, setSavingVisibility] = useState(false)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [week, all, xp] = await Promise.all([
          getLeaderboard('week'),
          getLeaderboard('all'),
          getClientXp(client.id),
        ])
        setBoards({ week, all })
        setTotalXp(xp.reduce((sum, e) => sum + e.points, 0))
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client, clientLoading])

  const rows = boards[period]
  const me = rows.find((r) => r.is_me)
  const iAmHidden = !!me?.is_hidden
  const level = levelFor(totalXp)

  const toggleHidden = async () => {
    if (!client) return
    setSavingVisibility(true)
    setError(null)
    try {
      await setLeaderboardHidden(client.id, !iAmHidden)
      const [week, all] = await Promise.all([getLeaderboard('week'), getLeaderboard('all')])
      setBoards({ week, all })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingVisibility(false)
    }
  }

  if (checking || clientLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">

      {/* Header + my level */}
      <div className="bg-[#1a1f3a] px-6 pt-5 pb-6">
        <div className="max-w-2xl mx-auto">
          <HomeButton />
          <p className="text-[#00D4E8] text-xs tracking-widest uppercase mb-1">Leaderboard</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-white/40 text-xs">Level {level.number}</p>
              <p className="text-white text-2xl font-semibold">{level.name}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-semibold">{totalXp.toLocaleString('en-IN')}</p>
              <p className="text-white/40 text-xs">total XP</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-[#00D4E8] rounded-full transition-all" style={{ width: `${level.progress * 100}%` }} />
          </div>
          <p className="text-white/40 text-xs mt-1.5">
            {level.next
              ? `${(level.next.min - totalXp).toLocaleString('en-IN')} XP to ${level.next.name}`
              : 'Top level reached'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {/* Period tabs */}
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
        {period === 'week' && (
          <p className="text-xs text-[#94a3b8] mb-3 px-1">Resets every Monday. Everyone starts level.</p>
        )}

        {/* Rankings */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden divide-y divide-[#f1f5f9]">
          {rows.length === 0 && (
            <p className="text-sm text-[#94a3b8] text-center py-10">No one on the board yet. Be the first — check in today.</p>
          )}
          {rows.map((row) => (
            <div
              key={row.client_id}
              className={`flex items-center gap-3 px-4 py-3 ${row.is_me ? 'bg-[#00D4E8]/10' : ''}`}
            >
              <span className="w-8 text-center text-sm font-semibold text-[#64748b]">
                {row.xp > 0 && row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}
              </span>
              <span className="flex-1 text-sm text-[#0f172a] truncate">
                {row.display_name}
                {row.is_me && <span className="text-xs text-[#0095A8] ml-2">You{row.is_hidden ? ' · hidden' : ''}</span>}
              </span>
              <span className="text-sm font-semibold text-[#1a1f3a]">{row.xp.toLocaleString('en-IN')} XP</span>
            </div>
          ))}
        </div>

        {/* How to earn */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mt-4">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">How to earn XP</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {[
              ['Daily check-in (same day)', 10],
              ['Workout done', 10],
              ['Full daily ritual', 10],
              ['Nutrition 8+', 5],
              ['Steps 8,000+', 5],
              ['Sleep 7h+', 5],
              ['Water 3L+', 5],
              ['Weekly check-in', 25],
              ['Lesson / audio finished', 5],
              ['7-day streak', 25],
              ['30-day streak', 100],
            ].map(([label, pts]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-[#64748b]">{label}</span>
                <span className="text-[#0f172a] font-medium">+{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between gap-4 mt-4 px-1">
          <p className="text-xs text-[#94a3b8]">
            {iAmHidden
              ? 'You are hidden — other clients can’t see you. You still earn XP.'
              : 'Other clients see you as your first name and last initial.'}
          </p>
          <button
            onClick={toggleHidden}
            disabled={savingVisibility || !me}
            className="flex-shrink-0 text-xs text-[#4a7fd4] underline underline-offset-2 disabled:opacity-50"
          >
            {savingVisibility ? 'Saving…' : iAmHidden ? 'Show me' : 'Hide me'}
          </button>
        </div>
      </div>
    </div>
  )
}
