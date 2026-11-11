'use client'

import { useState } from 'react'
import { PEAK_TOPICS, TOPIC_LABEL, type PeakTopic } from '@/lib/constants/peakIdeas'

const input = 'w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#00D4E8]'
const label = 'text-xs font-medium text-[#64748b]'

const BOOK_SUGGESTIONS = [
  ['Atomic Habits', 'James Clear'],
  ['Mindset', 'Carol S. Dweck'],
  ['Deep Work', 'Cal Newport'],
  ['Why We Sleep', 'Matthew Walker'],
  ['Can’t Hurt Me', 'David Goggins'],
  ['The Power of Habit', 'Charles Duhigg'],
  ['Essentialism', 'Greg McKeown'],
  ['Man’s Search for Meaning', 'Viktor E. Frankl'],
] as const

// Ask the AI writer for a new batch. Everything lands in Review as a draft.
export function IdeaWriter({ onCreated }: { onCreated: (n: number) => void }) {
  const [mode, setMode] = useState<'original' | 'book'>('original')
  const [topic, setTopic] = useState<PeakTopic | ''>('')
  const [count, setCount] = useState(7)
  const [focus, setFocus] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/peak-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          count,
          topic: mode === 'original' && topic ? topic : null,
          focus: focus.trim() || null,
          book: mode === 'book' ? { title: title.trim(), author: author.trim() } : null,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Something went wrong')
      onCreated(body.created)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 max-w-2xl flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Write new ideas</h2>
        <p className="text-sm text-[#64748b] mt-1">
          The AI writes more than you ask for, then a strict editor scores each one, rewrites anything below 9/10 and keeps only the best.
          Nothing reaches clients until you approve it in Review.
        </p>
      </div>

      <div className="flex gap-2">
        {(['original', 'book'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${mode === m ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e2e8f0] text-[#64748b]'}`}>
            {m === 'original' ? 'Original ideas' : 'Ideas from a book'}
          </button>
        ))}
      </div>

      {mode === 'original' ? (
        <label className="flex flex-col gap-1"><span className={label}>Topic</span>
          <select className={input} value={topic} onChange={(e) => setTopic(e.target.value as PeakTopic | '')}>
            <option value="">A mix of all topics</option>
            {PEAK_TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABEL[t]}</option>)}
          </select>
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1"><span className={label}>Book title</span>
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Atomic Habits" />
            </label>
            <label className="flex flex-col gap-1"><span className={label}>Author</span>
              <input className={input} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="James Clear" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BOOK_SUGGESTIONS.map(([t, a]) => (
              <button key={t} type="button" onClick={() => { setTitle(t); setAuthor(a) }} className="text-xs px-2.5 py-1 rounded-full border border-[#e2e8f0] text-[#64748b] hover:border-[#00D4E8]">{t}</button>
            ))}
          </div>
          <p className="text-xs text-[#94a3b8]">Ideas are rewritten in plain words and credited to the book — never copied. Running it again for the same book continues with new ideas.</p>
        </div>
      )}

      <label className="flex flex-col gap-1"><span className={label}>How many ({count})</span>
        <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
      </label>

      <label className="flex flex-col gap-1"><span className={label}>Your direction (optional)</span>
        <textarea className={input} rows={3} value={focus} onChange={(e) => setFocus(e.target.value)}
          placeholder="e.g. For clients who travel a lot for work. Or: focus on Diwali season and sweets." />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" disabled={busy || (mode === 'book' && (!title.trim() || !author.trim()))} onClick={submit}
        className="self-start px-5 py-2.5 rounded-lg bg-[#00D4E8] text-[#0a0f1a] text-sm font-semibold disabled:opacity-50">
        {busy ? 'Writing and editing… about 1–2 minutes' : `Write ${count} idea${count === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}
