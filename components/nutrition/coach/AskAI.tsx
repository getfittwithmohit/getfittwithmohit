'use client'

import { useState } from 'react'
import type { Food } from '@/lib/nutrition/foods'
import type { PlanDoc } from '@/lib/nutrition/plan'
import { diffDocs } from '@/lib/nutrition/diff'
import { toast } from '@/lib/ui/feedback'

const input = 'w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]'

// "Ask AI to change it": type an instruction (and/or paste call notes), see
// every change as before (red) / after (green), then Apply or Discard.
export function AskAI({
  doc, foods, clientId, diet, onApply,
}: {
  doc: PlanDoc
  foods: Map<string, Food>
  clientId: string | null
  diet: string | null
  onApply: (d: PlanDoc) => void
}) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [transcript, setTranscript] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [busy, setBusy] = useState(false)
  const [proposal, setProposal] = useState<{ plan: PlanDoc; summary: string[]; base: PlanDoc } | null>(null)

  const run = async () => {
    if (!instruction.trim() && !transcript.trim()) return toast('Type what to change, or paste call notes.')
    setBusy(true)
    try {
      const res = await fetch('/api/coach/nutrition/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc, instruction, transcript, clientId, diet }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setProposal({ plan: data.plan, summary: data.summary || [], base: doc })
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-left bg-[#1a1f3a] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold text-white">✨ Ask AI to change this plan</span>
          <span className="block text-xs text-white/50">Type it in plain words, or paste call notes. You approve every change.</span>
        </span>
        <span className="text-[#00D4E8] text-lg">›</span>
      </button>
    )
  }

  const diff = proposal ? diffDocs(proposal.base, proposal.plan, foods) : null

  return (
    <div className="bg-white border-2 border-[#00D4E8]/50 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0f172a] m-0">✨ Ask AI to change this plan</p>
        <button onClick={() => { setOpen(false); setProposal(null) }} className="text-xs text-[#94a3b8]">Close</button>
      </div>

      {!proposal && (
        <>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder={'e.g. Make weekday dinners lighter\nHe travels Thursday to Saturday — add hotel options\nProtein is 20 g short, fix it without supplements'}
            className={input}
          />
          {showTranscript ? (
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5} placeholder="Paste the call transcript or your notes" className={input} />
          ) : (
            <button onClick={() => setShowTranscript(true)} className="self-start text-xs font-medium text-[#007A8A]">+ Paste call notes or a transcript</button>
          )}
          <button onClick={run} disabled={busy} className="h-11 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-50">
            {busy ? 'Working on it… (up to a minute)' : 'Suggest changes'}
          </button>
        </>
      )}

      {proposal && diff && (
        <div className="flex flex-col gap-3">
          {proposal.summary.length > 0 && (
            <ul className="m-0 pl-5 list-disc text-sm text-[#0f172a] flex flex-col gap-0.5">
              {proposal.summary.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
          {diff.empty && <p className="text-sm text-[#64748b] m-0">No changes were needed for that.</p>}

          {diff.targets.length > 0 && (
            <div className="text-sm">
              <p className="text-xs font-semibold text-[#64748b] m-0 mb-1">Targets</p>
              {diff.targets.map((t) => (
                <p key={t.label} className="m-0">{t.label}: <span className="line-through text-[#b91c1c]">{t.before}</span> → <span className="text-[#15803d] font-semibold">{t.after}</span></p>
              ))}
            </div>
          )}
          {(diff.rulesAdded.length > 0 || diff.rulesRemoved.length > 0) && (
            <div className="text-sm">
              <p className="text-xs font-semibold text-[#64748b] m-0 mb-1">Rules</p>
              {diff.rulesRemoved.map((r) => <p key={`-${r}`} className="m-0 px-2 py-0.5 rounded bg-[#fef2f2] text-[#b91c1c] line-through">{r}</p>)}
              {diff.rulesAdded.map((r) => <p key={`+${r}`} className="m-0 px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d]">{r}</p>)}
            </div>
          )}
          {diff.meals.map((m, i) => (
            <p key={i} className={`text-sm m-0 px-2 py-1 rounded ${m.kind === 'removed' ? 'bg-[#fef2f2] text-[#b91c1c]' : m.kind === 'added' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
              {m.kind === 'removed' ? 'Meal removed: ' : m.kind === 'added' ? 'Meal added: ' : 'Meal: '}{m.kind === 'renamed' ? m.detail : m.name}
            </p>
          ))}
          {diff.options.map((o, i) => (
            <div key={i} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
              <p className="text-xs font-semibold text-[#0f172a] m-0 px-3 py-2 bg-[#f8fafc]">
                {o.meal} · {o.title || 'Option'} <span className="font-normal text-[#64748b]">{o.kind === 'added' ? '(new option)' : o.kind === 'removed' ? '(removed)' : ''}</span>
              </p>
              {o.before.length > 0 && (
                <div className="px-3 py-2 bg-[#fef2f2]">
                  {o.before.map((l, j) => <p key={j} className={`text-xs m-0 text-[#b91c1c] ${o.after.includes(l) ? 'opacity-50' : 'line-through'}`}>{l}</p>)}
                  {o.beforeTotals && <p className="text-[11px] m-0 mt-1 text-[#b91c1c]">{o.beforeTotals.kcal} kcal · {o.beforeTotals.protein} g protein</p>}
                </div>
              )}
              {o.after.length > 0 && (
                <div className="px-3 py-2 bg-[#f0fdf4]">
                  {o.after.map((l, j) => <p key={j} className={`text-xs m-0 text-[#15803d] ${o.before.includes(l) ? 'opacity-50' : 'font-medium'}`}>{l}</p>)}
                  {o.afterTotals && <p className="text-[11px] m-0 mt-1 text-[#15803d] font-semibold">{o.afterTotals.kcal} kcal · {o.afterTotals.protein} g protein</p>}
                </div>
              )}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onApply(proposal.plan); setProposal(null); setInstruction(''); setTranscript(''); setOpen(false); toast('Applied to your draft. Review, then publish.', 'success') }}
              disabled={diff.empty}
              className="col-span-1 h-10 rounded-lg bg-[#16a34a] text-white text-sm font-semibold disabled:opacity-40"
            >
              Apply
            </button>
            <button onClick={() => setProposal(null)} className="h-10 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a]">Edit request</button>
            <button onClick={() => { setProposal(null); setInstruction(''); setTranscript('') }} className="h-10 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b]">Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}
