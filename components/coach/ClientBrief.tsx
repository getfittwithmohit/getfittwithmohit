'use client'

import { useState } from 'react'
import { toast } from '@/lib/ui/feedback'
import type { CoachBrief } from '@/lib/brief/write'

// Coach Brief tab: a one-page read before the weekly call. Generated on
// demand; the latest one is kept in this browser so reopening is instant.

const STATUS = {
  on_track: { label: 'On track', bg: '#DCFCE7', fg: '#15803D' },
  watch: { label: 'Watch', bg: '#FEF3C7', fg: '#B45309' },
  at_risk: { label: 'At risk', bg: '#FEE2E2', fg: '#B91C1C' },
} as const

type Saved = { brief: CoachBrief; generatedAt: string }
const key = (clientId: string) => `gfm-brief:${clientId}`

function load(clientId: string): Saved | null {
  try {
    const raw = localStorage.getItem(key(clientId))
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function asText(name: string, b: CoachBrief) {
  const lines = [
    `${name} — ${STATUS[b.status]?.label || b.status}`,
    b.headline,
    '',
    'What changed:', ...b.changes.map((x) => `• ${x}`),
    ...(b.red_flags.length ? ['', 'Red flags:', ...b.red_flags.map((x) => `• ${x.flag} — ${x.why_it_matters}`)] : []),
    ...(b.wins.length ? ['', 'Wins:', ...b.wins.map((x) => `• ${x}`)] : []),
    '', 'Talking points:', ...b.talking_points.map((x, i) => `${i + 1}. ${x}`),
    ...(b.plan_tweaks.length ? ['', 'Plan tweaks:', ...b.plan_tweaks.map((x) => `• ${x}`)] : []),
    ...(b.data_gaps.length ? ['', 'Ask about:', ...b.data_gaps.map((x) => `• ${x}`)] : []),
  ]
  return lines.join('\n')
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">{title}</p>
      {children}
    </section>
  )
}

export function ClientBrief({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [saved, setSaved] = useState<Saved | null>(() => (typeof window === 'undefined' ? null : load(clientId)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `Something went wrong (${res.status})`)
      const next: Saved = { brief: j.brief, generatedAt: j.generatedAt }
      setSaved(next)
      try { localStorage.setItem(key(clientId), JSON.stringify(next)) } catch { /* private mode */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not write the brief')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!saved) return
    try {
      await navigator.clipboard.writeText(asText(clientName, saved.brief))
      toast('Brief copied', 'success')
    } catch {
      toast('Couldn’t copy — select the text instead')
    }
  }

  const b = saved?.brief
  const status = b ? STATUS[b.status] || STATUS.watch : null
  const when = saved ? new Date(saved.generatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-lg font-semibold text-[#0f172a]">Pre-call brief</p>
          <p className="text-sm text-[#64748b]">
            {when ? `Written ${when} from the last 14 days` : 'Reads the last 14 days: check-ins, workouts, meals, ritual, measurements'}
          </p>
        </div>
        <div className="flex gap-2">
          {b && (
            <button type="button" onClick={copy} className="min-h-11 px-4 rounded-xl border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0f172a]">
              Copy
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="min-h-11 px-4 rounded-xl bg-[#1a1f3a] text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? 'Writing…' : b ? 'Refresh' : 'Write brief'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-[#b91c1c] text-sm rounded-xl p-4">{error}</div>}

      {busy && !b && <div className="h-64 rounded-2xl bg-white border border-[#e2e8f0] animate-pulse" />}

      {!b && !busy && !error && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 text-[15px] text-[#475569] leading-relaxed">
          Tap <strong>Write brief</strong> before your call. It shows what changed, red flags, wins, three talking points and
          small plan tweaks — every number comes straight from {clientName.split(' ')[0] || 'the client'}’s data.
        </div>
      )}

      {b && status && (
        <div className={`flex flex-col gap-4 ${busy ? 'opacity-60' : ''}`}>
          <section className="bg-[#1a1f3a] rounded-2xl p-5 text-white flex flex-col gap-2">
            <span className="self-start text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.fg }}>{status.label}</span>
            <p className="text-lg font-semibold leading-snug">{b.headline}</p>
          </section>

          <Section title="What changed">
            <ul className="flex flex-col gap-2">
              {b.changes.map((x, i) => <li key={i} className="text-[15px] text-[#0f172a] leading-snug">{x}</li>)}
            </ul>
          </Section>

          {b.red_flags.length > 0 && (
            <Section title="Red flags">
              <ul className="flex flex-col gap-3">
                {b.red_flags.map((x, i) => (
                  <li key={i} className="border-l-[3px] border-[#ef4444] pl-3">
                    <p className="text-[15px] font-semibold text-[#0f172a]">{x.flag}</p>
                    <p className="text-sm text-[#475569] mt-0.5">{x.why_it_matters}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {b.wins.length > 0 && (
            <Section title="Wins to celebrate">
              <ul className="flex flex-col gap-2">
                {b.wins.map((x, i) => <li key={i} className="text-[15px] text-[#0f172a] leading-snug border-l-[3px] border-[#22c55e] pl-3">{x}</li>)}
              </ul>
            </Section>
          )}

          <Section title="Talking points">
            <ol className="flex flex-col gap-3">
              {b.talking_points.map((x, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E6F7F9] text-[#007A8A] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[15px] text-[#0f172a] leading-snug">{x}</span>
                </li>
              ))}
            </ol>
          </Section>

          {b.plan_tweaks.length > 0 && (
            <Section title="Plan tweaks to consider">
              <ul className="flex flex-col gap-2">
                {b.plan_tweaks.map((x, i) => <li key={i} className="text-[15px] text-[#0f172a] leading-snug">• {x}</li>)}
              </ul>
            </Section>
          )}

          {b.data_gaps.length > 0 && (
            <Section title="Ask about">
              <ul className="flex flex-col gap-2">
                {b.data_gaps.map((x, i) => <li key={i} className="text-[15px] text-[#475569] leading-snug">• {x}</li>)}
              </ul>
            </Section>
          )}

          <p className="text-sm text-[#64748b]">Written by AI from this client’s data. Numbers are calculated by the app, not guessed — but use your judgment.</p>
        </div>
      )}
    </div>
  )
}
