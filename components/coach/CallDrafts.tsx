'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/lib/ui/feedback'

// Calls tab, top: AI-written notes from Fathom recordings (or a pasted
// transcript). "Use for Week N" fills that week's call form; nothing is
// saved until the coach taps Save there.

export interface CallDraft {
  id: string
  source: 'fathom' | 'paste'
  client_id: string | null
  week_number: number | null
  meeting_title: string | null
  meeting_at: string | null
  recording_url: string | null
  status: 'processing' | 'unmatched' | 'draft' | 'applied' | 'dismissed' | 'error'
  discussed: string | null
  changes: string | null
  next_focus: string | null
  whatsapp_message: string | null
  error: string | null
}

const dayLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' }) : ''

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast('Copied — paste it in WhatsApp', 'success')
  } catch {
    toast('Couldn’t copy. Long-press the message to copy it.')
  }
}

function Field({ label, text }: { label: string; text: string | null }) {
  if (!text) return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-[#0f172a] whitespace-pre-wrap leading-relaxed m-0">{text}</p>
    </div>
  )
}

export function WhatsAppBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-[#15803d] uppercase tracking-wide m-0">WhatsApp recap</p>
        <button onClick={() => copyText(message)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#16a34a] text-white">
          Copy
        </button>
      </div>
      <p className="text-sm text-[#0f172a] whitespace-pre-wrap leading-relaxed m-0 select-text">{message}</p>
    </div>
  )
}

export function CallDrafts({
  clientId,
  maxWeek,
  reloadKey,
  onUse,
}: {
  clientId: string
  maxWeek: number
  reloadKey: number
  onUse: (draft: CallDraft, week: number) => void
}) {
  const [drafts, setDrafts] = useState<CallDraft[]>([])
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [weeks, setWeeks] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteWeek, setPasteWeek] = useState(maxWeek)
  const [pasteText, setPasteText] = useState('')
  const [openApplied, setOpenApplied] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    const res = await fetch(`/api/coach/call-notes?clientId=${clientId}`)
    const data = await res.json().catch(() => ({}))
    return { drafts: (data.drafts || []) as CallDraft[], setupNeeded: !!data.setupNeeded }
  }, [clientId])

  useEffect(() => {
    let cancelled = false
    load().then((r) => {
      if (cancelled) return
      setDrafts(r.drafts)
      setSetupNeeded(r.setupNeeded)
    })
    return () => { cancelled = true }
  }, [load, reloadKey, tick])

  // A call that just ended is still being written: check again shortly.
  const processing = drafts.some((d) => d.status === 'processing')
  useEffect(() => {
    if (!processing) return
    const t = setTimeout(() => setTick((n) => n + 1), 6000)
    return () => clearTimeout(t)
  }, [processing, drafts])

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/coach/call-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong')
    return data
  }

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusy(id)
    try {
      await post(body)
      setTick((n) => n + 1)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const submitPaste = async () => {
    setBusy('paste')
    try {
      await post({ action: 'paste', clientId, weekNumber: pasteWeek, transcript: pasteText })
      setPasteOpen(false)
      setPasteText('')
      setTick((n) => n + 1)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const weekOptions = Array.from({ length: Math.max(1, maxWeek) }, (_, i) => i + 1)
  const active = drafts.filter((d) => d.status !== 'applied')
  const applied = drafts.filter((d) => d.status === 'applied' && d.whatsapp_message).slice(0, 3)

  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide m-0">Notes from calls</p>
        <button
          onClick={() => { setPasteWeek(maxWeek); setPasteOpen((o) => !o) }}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#e2e8f0] text-[#0f172a] bg-white"
        >
          {pasteOpen ? 'Close' : 'Paste a transcript'}
        </button>
      </div>

      {setupNeeded && (
        <p className="text-xs text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2 m-0">
          Run <code>supabase/fathom_call_notes.sql</code> in Supabase to turn on notes from calls.
        </p>
      )}

      {pasteOpen && (
        <div className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#64748b]">For</label>
            <select value={pasteWeek} onChange={(e) => setPasteWeek(Number(e.target.value))} className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-1.5 bg-white">
              {weekOptions.map((w) => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder="Paste the call transcript here (from Fathom, Zoom, Meet…)"
            className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00D4E8]"
          />
          <button
            onClick={submitPaste}
            disabled={busy === 'paste' || pasteText.trim().length < 200}
            className="w-full bg-[#1a1f3a] text-[#00D4E8] py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {busy === 'paste' ? 'Writing notes… (about 20 seconds)' : 'Write notes'}
          </button>
        </div>
      )}

      {!setupNeeded && active.length === 0 && !pasteOpen && (
        <p className="text-xs text-[#94a3b8] m-0">
          Recorded calls show up here a few minutes after they end, with notes and a WhatsApp recap ready to review.
        </p>
      )}

      {active.map((d) => {
        const week = weeks[d.id] ?? Math.min(d.week_number || maxWeek, maxWeek)
        return (
          <div key={d.id} className="bg-white border-2 border-[#00D4E8]/40 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] m-0">
                  {d.source === 'fathom' ? '🎙 From Fathom' : '📋 From transcript'} · {dayLabel(d.meeting_at)}
                </p>
                {d.meeting_title && <p className="text-xs text-[#64748b] m-0 truncate">{d.meeting_title}</p>}
              </div>
              {d.recording_url && (
                <a href={d.recording_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#007A8A] whitespace-nowrap">
                  Recording ↗
                </a>
              )}
            </div>

            {d.status === 'processing' && <p className="text-sm text-[#64748b] m-0 animate-pulse">Writing notes…</p>}

            {d.status === 'error' && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#b91c1c] m-0">{d.error || 'Couldn’t write the notes.'}</p>
                {d.source === 'fathom' && (
                  <button onClick={() => act(d.id, { action: 'retry', draftId: d.id })} disabled={busy === d.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a1f3a] text-[#00D4E8] disabled:opacity-50">
                    {busy === d.id ? 'Trying…' : 'Try again'}
                  </button>
                )}
              </div>
            )}

            {d.status === 'draft' && (
              <>
                <Field label="What we discussed" text={d.discussed} />
                <Field label="What we're changing" text={d.changes} />
                <Field label="Next week's focus" text={d.next_focus} />
                {d.whatsapp_message && <WhatsAppBox message={d.whatsapp_message} />}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={week}
                    onChange={(e) => setWeeks((p) => ({ ...p, [d.id]: Number(e.target.value) }))}
                    className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-2 bg-white"
                    aria-label="Which week's call"
                  >
                    {weekOptions.map((w) => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                  <button onClick={() => onUse(d, week)} className="flex-1 min-w-[140px] bg-[#1a1f3a] text-[#00D4E8] py-2.5 rounded-lg text-sm font-medium">
                    Use for Week {week}
                  </button>
                </div>
              </>
            )}

            {d.status !== 'processing' && (
              <button onClick={() => act(d.id, { action: 'dismiss', draftId: d.id })} disabled={busy === d.id} className="self-start text-xs text-[#94a3b8]">
                Dismiss
              </button>
            )}
          </div>
        )
      })}

      {applied.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)]">
          <button onClick={() => setOpenApplied(openApplied === d.id ? null : d.id)} className="w-full flex items-center justify-between px-4 py-3 text-left">
            <span className="text-xs text-[#64748b]">✅ Week {d.week_number} notes saved · WhatsApp recap</span>
            <span className="text-xs text-[#94a3b8]">{openApplied === d.id ? '▲' : '▼'}</span>
          </button>
          {openApplied === d.id && d.whatsapp_message && (
            <div className="px-4 pb-4"><WhatsAppBox message={d.whatsapp_message} /></div>
          )}
        </div>
      ))}
    </div>
  )
}
