'use client'

import { useState } from 'react'
import type { PeakIdea } from '@/lib/types/peakIdeas'
import { PEAK_TOPICS, PEAK_TRIGGERS, TOPIC_LABEL, TRIGGER_LABEL, topicColor, type PeakTopic, type PeakTrigger } from '@/lib/constants/peakIdeas'
import { deleteIdea, setIdeasStatus, updateIdea } from '@/lib/supabase/queries/peakIdeas'

const input = 'w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#00D4E8]'
const label = 'text-xs font-medium text-[#64748b]'

type Editable = Pick<PeakIdea, 'topic' | 'hook' | 'body' | 'action' | 'easier_action' | 'coach_take' | 'recall_question' | 'recall_options' | 'recall_answer' | 'triggers'>

function pick(i: PeakIdea): Editable {
  return {
    topic: i.topic, hook: i.hook, body: i.body, action: i.action, easier_action: i.easier_action,
    coach_take: i.coach_take, recall_question: i.recall_question, recall_options: [...i.recall_options],
    recall_answer: i.recall_answer, triggers: [...i.triggers],
  }
}

// One idea: a colour preview the coach sees as the client will, and every field editable.
export function IdeaEditor({ idea, onChanged, defaultOpen = false }: { idea: PeakIdea; onChanged: () => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState<Editable>(() => pick(idea))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(idea))
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const save = () => run(() => updateIdea(idea.id, { ...draft, coach_take: draft.coach_take?.trim() || null }))
  const approve = () => run(async () => {
    if (dirty) await updateIdea(idea.id, { ...draft, coach_take: draft.coach_take?.trim() || null })
    await setIdeasStatus([idea.id], 'approved')
  })
  const archive = () => run(() => setIdeasStatus([idea.id], 'archived'))
  const restore = () => run(() => setIdeasStatus([idea.id], 'draft'))
  const remove = () => { if (window.confirm('Delete this idea for good? Clients who saved it will lose it.')) run(() => deleteIdea(idea.id)) }

  const color = topicColor(draft.topic)

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full text-left flex items-stretch">
        <span className="w-2 shrink-0" style={{ background: color }} />
        <span className="flex-1 p-4 flex flex-col gap-1">
          <span className="text-[15px] font-semibold text-[#0f172a] leading-snug">{idea.hook}</span>
          <span className="text-xs text-[#64748b]">
            {TOPIC_LABEL[idea.topic]}
            {idea.kind === 'book' ? ` · ${idea.book_title} (${idea.book_order})` : ''}
            {idea.quality_score ? ` · editor score ${idea.quality_score}/10` : ''}
            {idea.triggers.length ? ` · ${idea.triggers.map((t) => TRIGGER_LABEL[t] || t).join(', ')}` : ''}
          </span>
        </span>
        <span className="px-4 flex items-center text-[#94a3b8] text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-[#e2e8f0] p-4 grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* Preview as the client sees it */}
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: color, color: '#111318' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider">{TOPIC_LABEL[draft.topic]}</span>
              <p className="text-xl font-bold leading-tight">{draft.hook}</p>
            </div>
            <div className="rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line" style={{ background: color, color: '#111318' }}>{draft.body}</div>
            <div className="rounded-2xl p-4 bg-[#111318] text-white text-sm" style={{ border: `2px solid ${color}` }}>
              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>Try this today</p>
              <p className="mt-1 font-semibold">{draft.action}</p>
              <p className="mt-2 text-xs text-white/60">Easier: {draft.easier_action}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1"><span className={label}>Topic</span>
                <select className={input} value={draft.topic} onChange={(e) => set('topic', e.target.value as PeakTopic)}>
                  {PEAK_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
                </select>
              </label>
              <div className="flex flex-col gap-1"><span className={label}>Best moment to show it</span>
                <div className="flex flex-wrap gap-1.5">
                  {PEAK_TRIGGERS.map((t) => {
                    const on = draft.triggers.includes(t)
                    return (
                      <button key={t} type="button" aria-pressed={on}
                        onClick={() => set('triggers', on ? draft.triggers.filter((x) => x !== t) : [...draft.triggers, t as PeakTrigger])}
                        className={`text-[11px] px-2 py-1 rounded-full border ${on ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e2e8f0] text-[#64748b]'}`}>
                        {TRIGGER_LABEL[t]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <label className="flex flex-col gap-1"><span className={label}>Hook (panel 1)</span>
              <input className={input} value={draft.hook} onChange={(e) => set('hook', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1"><span className={label}>Idea (panel 2) — blank line between paragraphs</span>
              <textarea className={input} rows={6} value={draft.body} onChange={(e) => set('body', e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1"><span className={label}>Try this today</span>
                <textarea className={input} rows={2} value={draft.action} onChange={(e) => set('action', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className={label}>Easier version</span>
                <textarea className={input} rows={2} value={draft.easier_action} onChange={(e) => set('easier_action', e.target.value)} />
              </label>
            </div>
            <label className="flex flex-col gap-1"><span className={label}>Coach Mohit’s take (optional)</span>
              <textarea className={input} rows={2} value={draft.coach_take || ''} onChange={(e) => set('coach_take', e.target.value)} />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Recall question — tick the right answer</span>
              <input className={input} value={draft.recall_question} onChange={(e) => set('recall_question', e.target.value)} />
              {draft.recall_options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name={`ans-${idea.id}`} aria-label={`Option ${i + 1} is correct`} checked={draft.recall_answer === i} onChange={() => set('recall_answer', i)} />
                  <input className={input} value={opt} onChange={(e) => set('recall_options', draft.recall_options.map((o, j) => (j === i ? e.target.value : o)))} />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              {idea.status !== 'approved' && (
                <button type="button" disabled={busy} onClick={approve} className="px-4 py-2 rounded-lg bg-[#00D4E8] text-[#0a0f1a] text-sm font-semibold disabled:opacity-50">
                  {dirty ? 'Save & approve' : 'Approve'}
                </button>
              )}
              {dirty && (
                <button type="button" disabled={busy} onClick={save} className="px-4 py-2 rounded-lg bg-[#0f172a] text-white text-sm font-semibold disabled:opacity-50">Save changes</button>
              )}
              {idea.status === 'archived'
                ? <button type="button" disabled={busy} onClick={restore} className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-sm">Back to review</button>
                : <button type="button" disabled={busy} onClick={archive} className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b]">{idea.status === 'approved' ? 'Retire' : 'Reject'}</button>}
              <button type="button" disabled={busy} onClick={remove} className="px-4 py-2 rounded-lg text-sm text-red-600 ml-auto">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
