'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getTodayIdea } from '@/lib/supabase/queries/peakIdeas'
import type { ClientIdea } from '@/lib/types/peakIdeas'
import { PEAK, TOPIC_LABEL, topicColor } from '@/lib/constants/peakIdeas'

// Home-screen "Today's PEAK Idea". Hidden until Coach Mohit has approved ideas.
export function PeakIdeaCard({ clientId }: { clientId: string }) {
  const [row, setRow] = useState<ClientIdea | null>(null)

  useEffect(() => {
    let cancelled = false
    getTodayIdea(clientId)
      .then((r) => { if (!cancelled) setRow(r) })
      .catch(() => {}) // optional card; never break Home over it
    return () => { cancelled = true }
  }, [clientId])

  if (!row) return null
  const idea = row.peak_ideas
  const color = topicColor(idea.topic)
  const status = row.committed_at ? '✓ Promise made' : row.opened_at ? 'Finish it' : '1 min read'

  return (
    <Link href="/ideas" className="block rounded-3xl overflow-hidden mb-3" style={{ background: PEAK.surface }}>
      <div className="relative p-5 flex flex-col gap-3 overflow-hidden" style={{ background: color, color: PEAK.ink }}>
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" className="absolute -right-10 -top-10">
          <circle cx="80" cy="80" r="70" fill="rgba(17,19,24,0.10)" />
          <circle cx="100" cy="60" r="30" fill="rgba(255,255,255,0.22)" />
        </svg>
        <p className="relative text-[11px] tracking-[0.14em] uppercase font-bold">Today’s PEAK Idea · {TOPIC_LABEL[idea.topic]}</p>
        <p className="relative text-[21px] font-bold leading-tight">{idea.hook}</p>
      </div>
      <div className="px-5 py-3.5 flex items-center justify-between">
        <p className="text-[13px]" style={{ color: PEAK.muted }}>{status}</p>
        <span className="h-9 px-4 rounded-xl flex items-center text-sm font-bold" style={{ background: PEAK.cyan, color: PEAK.ink }}>
          {row.opened_at ? 'Open' : 'Read'}
        </span>
      </div>
    </Link>
  )
}
