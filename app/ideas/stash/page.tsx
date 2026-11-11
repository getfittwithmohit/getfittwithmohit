'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { getMyIdeas } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea } from '@/lib/types/peakIdeas'
import { PEAK, PEAK_TOPICS, TOPIC_LABEL, topicColor, type PeakTopic } from '@/lib/constants/peakIdeas'
import { ErrorNote, Icon, IconButton, LoadingScreen, PeakShell } from '@/components/peak/ui'

export default function StashPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const [mine, setMine] = useState<ClientIdea[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState<PeakTopic | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    getMyIdeas(client.id)
      .then((rows) => { if (!cancelled) setMine(rows) })
      .catch((err) => { if (!cancelled) { setError((err as Error).message); setMine([]) } })
    return () => { cancelled = true }
  }, [client, clientLoading])

  const saved = useMemo(() => (mine || []).filter((r) => r.saved_at), [mine])
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return saved.filter((r) => {
      if (topic && r.peak_ideas.topic !== topic) return false
      if (!q) return true
      const i = r.peak_ideas
      return [i.hook, i.body, i.action, i.book_title || ''].some((t) => t.toLowerCase().includes(q))
    })
  }, [saved, topic, search])

  if (checking || clientLoading || mine === null) return <LoadingScreen />

  const kept = mine.filter((r) => r.outcome === 'done').length
  const countByTopic = (t: PeakTopic) => saved.filter((r) => r.peak_ideas.topic === t).length

  return (
    <PeakShell>
      <div className="px-5 pt-5"><IconButton label="Back to PEAK Ideas" href="/ideas">{Icon.back}</IconButton></div>

      <header className="px-6 pt-4 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <p className="text-xs tracking-[0.16em] uppercase font-semibold" style={{ color: PEAK.muted }}>PEAK Ideas</p>
          <h1 className="text-[28px] font-bold">My Stash</h1>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-[22px] font-bold" style={{ color: PEAK.green }}>{kept}</p>
          <p className="text-[11px]" style={{ color: PEAK.muted }}>action{kept === 1 ? '' : 's'} kept</p>
        </div>
      </header>

      {error && <ErrorNote message={error} />}

      {saved.length === 0 ? (
        <div className="mx-4 mt-6 p-6 rounded-[24px]" style={{ background: PEAK.surface }}>
          <p className="text-lg font-semibold">Your stash is empty</p>
          <p className="mt-1 text-sm" style={{ color: PEAK.soft }}>Tap Save on any idea that hits home. We’ll bring it back so it sticks.</p>
        </div>
      ) : (
        <>
          <label className="mx-4 mt-[18px] h-[46px] px-3.5 rounded-[14px] flex items-center gap-2.5" style={{ background: PEAK.surface }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PEAK.muted} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your ideas" aria-label="Search your ideas" className="flex-1 bg-transparent outline-none text-sm" style={{ color: PEAK.text }} />
          </label>

          <div className="mx-4 mt-4 grid grid-cols-2 gap-2.5">
            {PEAK_TOPICS.filter((t) => countByTopic(t) > 0).map((t) => {
              const active = topic === t
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTopic(active ? null : t)}
                  className="p-4 rounded-[20px] min-h-[96px] flex flex-col justify-between text-left"
                  style={{ background: topicColor(t), color: PEAK.ink, outline: active ? `3px solid ${PEAK.text}` : 'none', outlineOffset: 2 }}
                >
                  <span className="text-base font-bold">{TOPIC_LABEL[t]}</span>
                  <span className="text-[13px] font-medium">{countByTopic(t)} idea{countByTopic(t) === 1 ? '' : 's'}</span>
                </button>
              )
            })}
          </div>

          <div className="mx-4 mt-5 mb-6 flex flex-col gap-2">
            {shown.map((r) => (
              <Link key={r.id} href={`/ideas/${r.id}`} className="p-4 rounded-2xl flex items-center gap-3" style={{ background: PEAK.surface }}>
                <span className="w-2.5 h-9 rounded shrink-0" style={{ background: topicColor(r.peak_ideas.topic) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{r.peak_ideas.hook}</p>
                  <p className="mt-0.5 text-xs" style={{ color: PEAK.muted }}>
                    {r.outcome === 'done' ? '✓ Action kept' : r.peak_ideas.book_title ? r.peak_ideas.book_title : TOPIC_LABEL[r.peak_ideas.topic]}
                  </p>
                </div>
                {Icon.chevron}
              </Link>
            ))}
            {shown.length === 0 && <p className="text-sm px-2" style={{ color: PEAK.muted }}>No saved ideas match.</p>}
          </div>
        </>
      )}

      <div className="flex-1" />
      <div className="px-4 pb-6">
        <Link href="/ideas/books" className="h-[52px] rounded-2xl flex items-center justify-center text-sm font-semibold" style={{ border: `1px solid ${PEAK.line}` }}>Browse books</Link>
      </div>
    </PeakShell>
  )
}
