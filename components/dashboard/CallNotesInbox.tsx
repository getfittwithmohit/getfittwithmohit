'use client'

import { Icon } from '@/components/ui/Icon'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/ui/feedback'
import type { CallDraft } from '@/components/coach/CallDrafts'

type InboxDraft = CallDraft & { invitee_emails: string[]; clients: { full_name: string } | null }

const dayLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' }) : ''

// Dashboard panel: recorded calls whose notes are ready to review, and
// recorded calls the app couldn't match to a client (pick one to file it).
export function CallNotesInbox({ clients }: { clients: { id: string; full_name: string }[] }) {
  const [drafts, setDrafts] = useState<InboxDraft[]>([])
  const [pick, setPick] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/coach/call-notes')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setDrafts(d.drafts || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tick])

  const processing = drafts.some((d) => d.status === 'processing')
  useEffect(() => {
    if (!processing) return
    const t = setTimeout(() => setTick((n) => n + 1), 8000)
    return () => clearTimeout(t)
  }, [processing, drafts])

  if (drafts.length === 0) return null

  const post = async (id: string, body: Record<string, unknown>) => {
    setBusy(id)
    try {
      const res = await fetch('/api/coach/call-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setTick((n) => n + 1)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong')
      setTick((n) => n + 1)
    } finally {
      setBusy(null)
    }
  }

  const ready = drafts.filter((d) => d.client_id && d.status !== 'unmatched')
  const unmatched = drafts.filter((d) => d.status === 'unmatched')
  const sorted = [...clients].sort((a, b) => a.full_name.localeCompare(b.full_name))

  return (
    <div className="bg-white rounded-3xl px-4 md:px-5 py-4 flex flex-col gap-2" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
      <p className="text-[17px] font-bold text-[#0f172a] m-0 flex items-center gap-2"><Icon name="mic" size={18} />Call notes</p>

      {ready.map((d) => (
        <a
          key={d.id}
          href={`/coach/dashboard/client/${d.client_id}?tab=calls`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F9FB] px-4 py-3 hover:bg-[#F2F4F7]"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[#0f172a] truncate">
              {d.clients?.full_name || 'Client'} · Week {d.week_number}
            </span>
            <span className="block text-xs text-[#94a3b8]">{dayLabel(d.meeting_at)}</span>
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
              d.status === 'draft' ? 'bg-[#E6F7F9] text-[#007A8A]'
                : d.status === 'error' ? 'bg-[#fef2f2] text-[#b91c1c]'
                : 'bg-[#f1f5f9] text-[#64748b]'
            }`}
          >
            {d.status === 'draft' ? 'Review →' : d.status === 'error' ? 'Needs a retry' : 'Writing…'}
          </span>
        </a>
      ))}

      {unmatched.map((d) => (
        <div key={d.id} className="rounded-2xl border border-dashed border-[#cbd5e1] px-4 py-3 flex flex-col gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0f172a] m-0 truncate">{d.meeting_title || 'Recorded call'} · {dayLabel(d.meeting_at)}</p>
            <p className="text-xs text-[#94a3b8] m-0 truncate">
              Couldn’t match a client{d.invitee_emails?.length ? ` (${d.invitee_emails.join(', ')})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={pick[d.id] || ''}
              onChange={(e) => setPick((p) => ({ ...p, [d.id]: e.target.value }))}
              className="flex-1 min-w-[160px] text-sm border border-[#e2e8f0] rounded-lg px-2 py-2 bg-white"
              aria-label="Which client was this call with"
            >
              <option value="">Which client?</option>
              {sorted.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <button
              onClick={() => post(d.id, { action: 'assign', draftId: d.id, clientId: pick[d.id] })}
              disabled={!pick[d.id] || busy === d.id}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1a1f3a] text-[#00D4E8] disabled:opacity-40"
            >
              {busy === d.id ? 'Writing notes…' : 'Write notes'}
            </button>
            <button
              onClick={() => post(d.id, { action: 'dismiss', draftId: d.id })}
              disabled={busy === d.id}
              className="text-xs text-[#94a3b8] px-2 py-2"
            >
              Not a client call
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
