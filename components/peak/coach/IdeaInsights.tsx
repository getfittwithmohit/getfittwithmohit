'use client'

import { useEffect, useState } from 'react'
import { getActiveClientNames, getAllClientIdeasSince, listIdeas, type CoachIdeaRow } from '@/lib/supabase/queries/peakIdeas'
import type { PeakIdea } from '@/lib/types/peakIdeas'
import { addDaysIST, istDate, todayIST, formatDayLabel } from '@/lib/utils/istDate'
import { topicColor } from '@/lib/constants/peakIdeas'

interface Data {
  rows: CoachIdeaRow[]
  ideas: PeakIdea[]
  clients: { id: string; full_name: string }[]
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')

export function IdeaInsights() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllClientIdeasSince('2000-01-01'), listIdeas('approved'), getActiveClientNames()])
      .then(([rows, ideas, clients]) => { if (!cancelled) setData({ rows, ideas, clients }) })
      .catch((err) => { if (!cancelled) setError((err as Error).message) })
    return () => { cancelled = true }
  }, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) return <p className="text-sm text-[#64748b]">Loading…</p>

  const today = todayIST()
  const from = addDaysIST(today, -6)
  const week = data.rows.filter((r) => r.day >= from)
  const daily = week.filter((r) => r.is_daily)
  const openedDaily = daily.filter((r) => r.opened_at).length
  const made = week.filter((r) => r.committed_at).length
  const kept = week.filter((r) => r.outcome === 'done').length
  const activeIds = new Set(week.filter((r) => r.opened_at).map((r) => r.client_id))

  // How many unread approved ideas the least-read client has left
  const seenBy = new Map<string, number>()
  for (const r of data.rows) seenBy.set(r.client_id, (seenBy.get(r.client_id) || 0) + 1)
  const leastLeft = data.clients.length
    ? Math.min(...data.clients.map((c) => data.ideas.length - (seenBy.get(c.id) || 0)))
    : data.ideas.length

  const ideaById = new Map(data.ideas.map((i) => [i.id, i]))
  const saves = new Map<string, number>()
  const likes = new Map<string, number>()
  for (const r of data.rows) {
    if (r.saved_at) saves.set(r.idea_id, (saves.get(r.idea_id) || 0) + 1)
    if (r.reaction) likes.set(r.idea_id, (likes.get(r.idea_id) || 0) + r.reaction)
  }
  const topSaved = [...saves.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const leastLiked = [...likes.entries()].filter(([, n]) => n < 0).sort((a, b) => a[1] - b[1]).slice(0, 3)

  const perClient = data.clients.map((c) => {
    const mine = data.rows.filter((r) => r.client_id === c.id)
    const lastOpen = mine.map((r) => r.opened_at).filter(Boolean).sort().pop() || null
    const wk = mine.filter((r) => r.day >= from)
    return {
      ...c,
      lastOpen,
      days: new Set(wk.filter((r) => r.opened_at).map((r) => istDate(new Date(r.opened_at!)))).size,
      made: wk.filter((r) => r.committed_at).length,
      kept: wk.filter((r) => r.outcome === 'done').length,
    }
  }).sort((a, b) => (b.lastOpen || '').localeCompare(a.lastOpen || ''))

  const stat = (title: string, value: string, note: string) => (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-xs text-[#64748b]">{title}</p>
      <p className="text-3xl font-bold text-[#0f172a]">{value}</p>
      <p className="text-xs text-[#94a3b8]">{note}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {leastLeft < 14 && (
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 text-sm text-amber-900">
          {leastLeft <= 0
            ? 'Some clients have read every approved idea. Write and approve a new batch so they get one tomorrow.'
            : `Some clients have only ${leastLeft} unread idea${leastLeft === 1 ? '' : 's'} left. Write and approve a new batch soon.`}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {stat('Opening their daily idea (7 days)', pct(openedDaily, daily.length), `${activeIds.size} of ${data.clients.length} clients active`)}
        {stat('Promises kept (7 days)', pct(kept, made), `${kept} kept of ${made} made`)}
        {stat('Approved ideas', String(data.ideas.length), `${leastLeft > 0 ? leastLeft : 0} days left for your most active reader`)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#0f172a] mb-3">Most saved ideas</p>
          {topSaved.length === 0 && <p className="text-sm text-[#94a3b8]">No saves yet.</p>}
          <ul className="flex flex-col gap-2">
            {topSaved.map(([id, n]) => {
              const i = ideaById.get(id)
              return i ? (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-6 rounded shrink-0" style={{ background: topicColor(i.topic) }} />
                  <span className="flex-1 text-[#0f172a]">{i.hook}</span>
                  <span className="text-[#64748b]">{n}</span>
                </li>
              ) : null
            })}
          </ul>
          {leastLiked.length > 0 && (
            <>
              <p className="text-sm font-semibold text-[#0f172a] mt-5 mb-2">Not landing (more 👎 than 👍)</p>
              <ul className="flex flex-col gap-1.5">
                {leastLiked.map(([id]) => <li key={id} className="text-sm text-[#64748b]">{ideaById.get(id)?.hook}</li>)}
              </ul>
            </>
          )}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 overflow-x-auto">
          <p className="text-sm font-semibold text-[#0f172a] mb-3">Clients this week</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#64748b]">
                <th className="py-1.5 font-medium">Client</th>
                <th className="py-1.5 font-medium">Last opened</th>
                <th className="py-1.5 font-medium">Days</th>
                <th className="py-1.5 font-medium">Kept</th>
              </tr>
            </thead>
            <tbody>
              {perClient.map((c) => (
                <tr key={c.id} className="border-t border-[#f1f5f9]">
                  <td className="py-2 text-[#0f172a]">{c.full_name}</td>
                  <td className="py-2 text-[#64748b]">{c.lastOpen ? formatDayLabel(istDate(new Date(c.lastOpen))) : 'Never'}</td>
                  <td className="py-2 text-[#64748b]">{c.days}/7</td>
                  <td className="py-2 text-[#64748b]">{c.made ? `${c.kept}/${c.made}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
