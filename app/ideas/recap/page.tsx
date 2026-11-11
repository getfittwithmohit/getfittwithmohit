'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { getMyIdeas } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea } from '@/lib/types/peakIdeas'
import { PEAK, topicColor } from '@/lib/constants/peakIdeas'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'
import { ErrorNote, Icon, IconButton, LoadingScreen, PeakShell, shareCard } from '@/components/peak/ui'

export default function RecapPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const [mine, setMine] = useState<ClientIdea[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientLoading || !client) return
    let cancelled = false
    getMyIdeas(client.id)
      .then((rows) => { if (!cancelled) setMine(rows) })
      .catch((err) => { if (!cancelled) { setError((err as Error).message); setMine([]) } })
    return () => { cancelled = true }
  }, [client, clientLoading])

  if (checking || clientLoading || mine === null) return <LoadingScreen />

  const from = addDaysIST(todayIST(), -7)
  const week = mine.filter((r) => r.day >= from)
  const promises = week.filter((r) => r.committed_at)
  const kept = promises.filter((r) => r.outcome === 'done')
  // Idea of the week: the one they engaged with most
  const score = (r: ClientIdea) => (r.outcome === 'done' ? 3 : 0) + (r.saved_at ? 2 : 0) + (r.reaction === 1 ? 1 : 0) + (r.committed_at ? 1 : 0)
  const best = [...week].sort((a, b) => score(b) - score(a))[0]
  const firstName = client?.full_name?.split(' ')[0] || ''

  const headline =
    promises.length === 0
      ? 'A fresh week starts now.'
      : kept.length === promises.length
        ? `${kept.length} of ${promises.length} promises kept. Every single one.`
        : `${kept.length} of ${promises.length} promises kept.`
  const subline =
    promises.length === 0
      ? 'Read today’s idea and make one small promise.'
      : kept.length >= Math.ceil(promises.length / 2)
        ? `That’s who you’re becoming, ${firstName}.`
        : 'Every kept promise counts. Pick an easier version this week.'

  return (
    <PeakShell>
      <div className="px-5 pt-5"><IconButton label="Back to PEAK Ideas" href="/ideas">{Icon.back}</IconButton></div>
      <header className="px-6 pt-5 flex flex-col gap-1.5">
        <p className="text-xs tracking-[0.16em] uppercase font-semibold" style={{ color: PEAK.muted }}>Your week in ideas</p>
        <h1 className="text-[30px] font-bold leading-[1.15]">{headline}</h1>
        <p className="text-[15px]" style={{ color: PEAK.soft }}>{subline}</p>
      </header>

      {error && <ErrorNote message={error} />}

      {promises.length > 0 && (
        <ul className="mx-4 mt-[22px] flex flex-col gap-2">
          {promises.map((r) => (
            <li key={r.id} className="p-3.5 rounded-2xl flex items-center gap-3" style={{ background: PEAK.surface }}>
              <span className="w-2.5 h-9 rounded shrink-0" style={{ background: topicColor(r.peak_ideas.topic) }} />
              <p className="flex-1 text-sm" style={{ color: r.outcome === 'done' ? PEAK.text : PEAK.muted }}>
                {r.chose_easier ? r.peak_ideas.easier_action : r.peak_ideas.action}
              </p>
              {r.outcome === 'done'
                ? <span role="img" aria-label="Kept">{Icon.check()}</span>
                : <span className="text-xs" style={{ color: PEAK.muted }}>Not yet</span>}
            </li>
          ))}
        </ul>
      )}

      {best && (
        <Link href={`/ideas/${best.id}`} className="mx-4 mt-4 p-[18px] rounded-[20px] flex flex-col gap-1.5" style={{ background: 'rgba(245,184,61,0.10)', border: '1px solid rgba(245,184,61,0.35)' }}>
          <p className="text-xs tracking-[0.14em] uppercase font-bold" style={{ color: PEAK.gold }}>Your idea of the week</p>
          <p className="text-base font-semibold leading-snug">{best.peak_ideas.hook}</p>
        </Link>
      )}

      <div className="flex-1" />
      <div className="px-4 pt-6 pb-5 flex gap-2">
        {promises.length > 0 && (
          <button
            type="button"
            onClick={() => shareCard({
              topic: best?.peak_ideas.topic || 'Consistency',
              title: headline,
              lines: kept.slice(0, 4).map((r) => `✓ ${r.chose_easier ? r.peak_ideas.easier_action : r.peak_ideas.action}`),
              fileName: 'my-week.png',
            })}
            className="flex-1 h-[54px] rounded-2xl text-sm font-semibold"
            style={{ border: `1px solid ${PEAK.line}` }}
          >
            Share my week
          </button>
        )}
        <Link href="/ideas" className="flex-1 h-[54px] rounded-2xl flex items-center justify-center text-sm font-bold" style={{ background: PEAK.cyan, color: PEAK.ink }}>Close</Link>
      </div>
    </PeakShell>
  )
}
