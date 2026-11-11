'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { listIdeas, setIdeasStatus } from '@/lib/supabase/queries/peakIdeas'
import type { PeakIdea } from '@/lib/types/peakIdeas'
import { PEAK_TOPICS, TOPIC_LABEL, type PeakTopic } from '@/lib/constants/peakIdeas'
import { IdeaEditor } from '@/components/peak/coach/IdeaEditor'
import { IdeaWriter } from '@/components/peak/coach/IdeaWriter'
import { IdeaInsights } from '@/components/peak/coach/IdeaInsights'

type Tab = 'review' | 'library' | 'write' | 'insights'

export default function CoachIdeasPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<Tab>('review')
  const [ideas, setIdeas] = useState<PeakIdea[] | null>(null)
  const [version, setVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [topic, setTopic] = useState<PeakTopic | ''>('')
  const [showRetired, setShowRetired] = useState(false)
  const [search, setSearch] = useState('')
  const [approvingAll, setApprovingAll] = useState(false)

  useEffect(() => {
    if (checking) return
    let cancelled = false
    listIdeas()
      .then((list) => { if (!cancelled) setIdeas(list) })
      .catch((err) => { if (!cancelled) setError((err as Error).message) })
    return () => { cancelled = true }
  }, [checking, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const drafts = useMemo(() => (ideas || []).filter((i) => i.status === 'draft'), [ideas])
  const library = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (ideas || []).filter((i) =>
      (showRetired ? i.status === 'archived' : i.status === 'approved') &&
      (!topic || i.topic === topic) &&
      (!q || [i.hook, i.body, i.book_title || ''].some((t) => t.toLowerCase().includes(q)))
    )
  }, [ideas, topic, showRetired, search])

  if (checking) return <PageLoader />

  const approveAll = async () => {
    if (!window.confirm(`Approve all ${drafts.length} ideas? Clients can receive them from tomorrow.`)) return
    setApprovingAll(true)
    try {
      await setIdeasStatus(drafts.map((d) => d.id), 'approved')
      reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setApprovingAll(false)
    }
  }

  const approvedCount = (ideas || []).filter((i) => i.status === 'approved').length

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => (window.location.href = '/coach/dashboard')} className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1">
            ← Dashboard
          </button>
          <h1 className="text-white text-lg font-medium">PEAK Ideas</h1>
          <p className="text-white/40 text-xs">One idea a day, one small action. {approvedCount} live ideas.</p>
        </div>
      </div>

      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([
            { key: 'review', label: `📝 Review${drafts.length ? ` (${drafts.length})` : ''}` },
            { key: 'library', label: '📚 Live ideas' },
            { key: 'write', label: '✨ Write new' },
            { key: 'insights', label: '📈 Insights' },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setNotice(null) }}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? 'border-[#00D4E8] text-[#0f172a]' : 'border-transparent text-[#94a3b8] hover:text-[#64748b]'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3">{notice}</p>}

        {tab === 'review' && (
          !ideas ? <p className="text-sm text-[#64748b]">Loading…</p> :
          drafts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <p className="font-semibold text-[#0f172a]">Nothing to review</p>
              <p className="text-sm text-[#64748b] mt-1">Use <b>Write new</b> to get a fresh batch. Aim to stay at least two weeks ahead of your clients.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#64748b]">Read each one as your client would. Edit anything that doesn’t sound like you.</p>
                <button type="button" disabled={approvingAll} onClick={approveAll} className="px-4 py-2 rounded-lg bg-[#0f172a] text-white text-sm font-semibold whitespace-nowrap disabled:opacity-50">
                  Approve all {drafts.length}
                </button>
              </div>
              {drafts.map((i, n) => <IdeaEditor key={`${i.id}-${version}`} idea={i} onChanged={reload} defaultOpen={n === 0} />)}
            </>
          )
        )}

        {tab === 'library' && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ideas or books" className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm w-60" />
              <select value={topic} onChange={(e) => setTopic(e.target.value as PeakTopic | '')} className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm">
                <option value="">All topics</option>
                {PEAK_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
              </select>
              <label className="text-sm text-[#64748b] flex items-center gap-2 ml-2">
                <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} /> Show retired
              </label>
              <span className="text-sm text-[#94a3b8] ml-auto">{library.length} ideas</span>
            </div>
            {library.map((i) => <IdeaEditor key={`${i.id}-${version}`} idea={i} onChanged={reload} />)}
          </>
        )}

        {tab === 'write' && (
          <IdeaWriter onCreated={(n) => { reload(); setTab('review'); setNotice(`${n} new idea${n === 1 ? '' : 's'} ready for your review.`) }} />
        )}

        {tab === 'insights' && <IdeaInsights />}
      </div>
    </div>
  )
}
