'use client'

import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/lib/ui/feedback'
import { PROTEIN_KEYS, PROTEIN_LABEL } from '@/lib/nutrition/recipes'
import type { AutopilotStatus, RunSummary } from '@/lib/nutrition/recipeAutopilot'

const MAX_BATCHES = 12

// Recipe Autopilot: one switch, one button. It writes, reviews and publishes
// recipes; the coach only sees what needs his judgement.
export function AutopilotCard({ onChanged }: { onChanged: () => void }) {
  const [s, setS] = useState<AutopilotStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const load = useCallback(() => {
    return fetch('/api/coach/recipes/autopilot')
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error)))))
      .then((d: AutopilotStatus) => { setS(d); setError(null) })
      .catch((e) => setError((e as Error).message))
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async () => {
    if (!s) return
    const on = !s.autopilot
    setS({ ...s, autopilot: on })
    const r = await fetch('/api/coach/recipes/autopilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', on }) })
    if (!r.ok) { toast('Couldn’t change the setting'); setS({ ...s }) }
    else toast(on ? 'Autopilot on — recipes that pass review go live by themselves' : 'Autopilot off — every recipe waits for you', 'success')
  }

  const build = async () => {
    setRunning(true)
    setLog([])
    try {
      for (let i = 0; i < MAX_BATCHES; i++) {
        setLog((l) => [...l, i === 0 ? 'Looking at your clients’ plates and the book…' : 'Next batch…'])
        const r = await fetch('/api/coach/recipes/autopilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run' }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Autopilot stopped')
        const run = d as RunSummary & { done: boolean }
        if (run.kind === 'nothing') { setLog((l) => [...l, 'All done — nothing left to write.']); break }
        const what = run.kind === 'plates' ? 'plate dishes' : run.kind === 'rewrite' ? 'rewrites' : 'book recipes'
        setLog((l) => [...l, `${run.added} ${what} written · ${run.published} live · ${run.waiting} waiting for you`])
        onChanged()
        await load()
        if (run.done) { setLog((l) => [...l, 'All done.']); break }
      }
    } catch (e) {
      toast((e as Error).message)
      setLog((l) => [...l, `Stopped: ${(e as Error).message}`])
    } finally {
      setRunning(false)
      onChanged()
      load()
    }
  }

  if (error) return <div className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-2xl px-4 py-3">{error}</div>
  if (!s) return <div className="h-40 rounded-3xl gfm-shimmer" />

  const bookTotal = PROTEIN_KEYS.reduce((n, p) => n + Math.min(s.book[p], s.bookTarget), 0)
  const bookGoal = PROTEIN_KEYS.length * s.bookTarget

  return (
    <div className="rounded-3xl bg-[#1a1f3a] text-white p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#00D4E8]">RECIPE AUTOPILOT</p>
          <p className="m-0 mt-1 text-[22px] font-extrabold leading-tight">{s.autopilot ? 'Writing, checking and publishing for you' : 'Writing and checking — you approve'}</p>
          <p className="m-0 mt-1 text-[15px] text-white/65 max-w-xl">Every recipe is written, then reviewed by a second AI acting as a senior chef and nutritionist, then checked against your rules. Macros always come from your food library.</p>
        </div>
        <button onClick={toggle} role="switch" aria-checked={s.autopilot} className="flex items-center gap-2.5 min-h-11 pl-1.5 pr-4 rounded-full bg-white/10 hover:bg-white/15">
          <span className="w-11 h-7 rounded-full p-0.5 transition-colors" style={{ background: s.autopilot ? '#00D4E8' : 'rgba(255,255,255,0.25)' }}>
            <span className="block w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: s.autopilot ? 'translateX(16px)' : 'none' }} />
          </span>
          <span className="text-sm font-semibold">{s.autopilot ? 'Auto-publish on' : 'Auto-publish off'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {([
          [String(s.live), 'live for clients'],
          [String(s.waiting), 'waiting for you'],
          [s.plateDishes ? `${s.plateCovered}/${s.plateDishes}` : '—', 'plate dishes covered'],
          [`${bookTotal}/${bookGoal}`, 'recipe book'],
        ] as const).map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-white/[0.07] px-4 py-3">
            <div className="text-[24px] font-extrabold leading-none">{v}</div>
            <div className="mt-1.5 text-[13px] text-white/60">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROTEIN_KEYS.map((p) => (
          <span key={p} className="text-[13px] px-2.5 py-1 rounded-full" style={{ background: s.book[p] >= s.bookTarget ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)', color: s.book[p] >= s.bookTarget ? '#86EFAC' : 'rgba(255,255,255,0.7)' }}>
            {PROTEIN_LABEL[p]} {s.book[p]}/{s.bookTarget}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={build} disabled={running} className="min-h-12 px-5 rounded-2xl bg-[#00D4E8] text-[#1a1f3a] text-base font-extrabold inline-flex items-center gap-2 disabled:opacity-70">
          {running ? <span className="w-4 h-4 rounded-full border-2 border-[#1a1f3a] border-t-transparent animate-spin" /> : <Icon name="sparkle" size={18} />}
          {running ? 'Working… keep this tab open' : s.live === 0 ? 'Build my recipe book' : 'Fill the gaps now'}
        </button>
        <span className="text-[13px] text-white/55">
          {running ? 'About 2–3 minutes per batch of 6.' : s.lastSummary ? `Last run ${new Date(s.lastSummary.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}: ${s.lastSummary.published} live, ${s.lastSummary.waiting} waiting.` : 'Also runs by itself every night, and right after you publish a plan.'}
        </span>
      </div>

      {log.length > 0 && (
        <div className="rounded-2xl bg-black/20 px-4 py-3 flex flex-col gap-1 text-sm text-white/80" aria-live="polite">
          {log.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  )
}
