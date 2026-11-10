'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AUDIO_CATEGORIES, MAX_UPLOAD_MB, type AudioCategory } from '@/lib/constants/content'
import {
  createAudio,
  deleteAudio,
  getAudioUrl,
  getAudios,
  updateAudio,
} from '@/lib/supabase/queries/content'
import { formatDuration } from '@/lib/utils/video'
import type { Audio } from '@/lib/types/content'
import { fieldClass, labelClass, PublishToggle } from './shared'

type AudioDraft = {
  title: string
  description: string
  category: AudioCategory
  collection: string
  sort_order: string
}

const EMPTY_DRAFT: AudioDraft = {
  title: '',
  description: '',
  category: 'Audiobook',
  collection: '',
  sort_order: '1',
}

// Reads the length of an audio file in the browser before it is uploaded.
// Resolves null (rather than failing the upload) if the browser can't tell.
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const el = new window.Audio()
    const done = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    el.preload = 'metadata'
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? Math.round(el.duration) : null)
    el.onerror = () => done(null)
    el.src = url
  })
}

export function AudioManager() {
  const [audios, setAudios] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [draft, setDraft] = useState<AudioDraft>(EMPTY_DRAFT)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState<{ id: string; draft: AudioDraft } | null>(null)
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getAudios()
      .then((data) => {
        if (!cancelled) setAudios(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      setAudios(await getAudios())
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const parseOrder = (value: string): number | null => {
    const n = Number(value)
    return value.trim() && Number.isInteger(n) && n >= 0 ? n : null
  }

  const handleUpload = async () => {
    if (!file) return setError('Choose an audio file first.')
    if (!draft.title.trim()) return setError('Give the audio a title first.')
    const order = parseOrder(draft.sort_order)
    if (order === null) return setError('Order must be a whole number (1, 2, 3…).')
    const ok = await run(async () => {
      const duration = await readDuration(file)
      await createAudio({ ...draft, sort_order: order, duration_seconds: duration, file })
    })
    if (ok) {
      // Keep category + book title and bump the number, so uploading the next
      // chapter of the same audiobook is just "pick file, type title, upload".
      setDraft({ ...draft, title: '', description: '', sort_order: String(order + 1) })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    if (!editing.draft.title.trim()) return setError('The audio needs a title.')
    const order = parseOrder(editing.draft.sort_order)
    if (order === null) return setError('Order must be a whole number (1, 2, 3…).')
    const ok = await run(() =>
      updateAudio(editing.id, {
        title: editing.draft.title.trim(),
        description: editing.draft.description.trim() || null,
        category: editing.draft.category,
        collection: editing.draft.collection.trim() || null,
        sort_order: order,
      })
    )
    if (ok) setEditing(null)
  }

  const togglePreview = async (audio: Audio) => {
    if (preview?.id === audio.id) return setPreview(null)
    try {
      setPreview({ id: audio.id, url: await getAudioUrl(audio) })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const collections = Array.from(new Set(audios.map((a) => a.collection).filter(Boolean))) as string[]

  if (loading) return <p className="text-sm text-[#64748b] py-8 text-center">Loading audios…</p>

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3 flex justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline flex-shrink-0">Dismiss</button>
        </div>
      )}

      <datalist id="audio-collections">
        {collections.map((c) => <option key={c} value={c} />)}
      </datalist>

      {/* Upload */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <p className="text-sm font-medium text-[#0f172a] mb-3">Upload audio</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Audio file (MP3, M4A or WAV · up to {MAX_UPLOAD_MB} MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg"
              className="text-sm text-[#64748b]"
              onChange={(e) => {
                const picked = e.target.files?.[0] || null
                setFile(picked)
                if (picked && !draft.title.trim()) {
                  setDraft({ ...draft, title: picked.name.replace(/\.[^.]+$/, '') })
                }
              }}
            />
          </div>
          <AudioFields draft={draft} onChange={setDraft} />
          <div>
            <Button onClick={handleUpload} loading={busy}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </div>
          <p className="text-xs text-[#94a3b8]">
            New audios start as drafts. For an audiobook, upload one chapter at a time with the same book title and
            chapter numbers 1, 2, 3…
          </p>
        </div>
      </div>

      {audios.length === 0 && (
        <p className="text-sm text-[#94a3b8] text-center py-6">No audios yet. Upload your first one above.</p>
      )}

      {AUDIO_CATEGORIES.map((category) => {
        const items = audios
          .filter((a) => a.category === category.value)
          .sort((a, b) => (a.collection || '').localeCompare(b.collection || '') || a.sort_order - b.sort_order)
        if (!items.length) return null
        return (
          <div key={category.value} className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
              {category.emoji} {category.label} · {items.length}
            </p>
            <div className="flex flex-col divide-y divide-[#f1f5f9]">
              {items.map((audio) =>
                editing?.id === audio.id ? (
                  <div key={audio.id} className="py-3 flex flex-col gap-3">
                    <AudioFields draft={editing.draft} onChange={(d) => setEditing({ id: audio.id, draft: d })} />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} loading={busy}>Save</Button>
                      <Button variant="back" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div key={audio.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">{audio.title}</p>
                        <p className="text-xs text-[#94a3b8] mt-0.5 truncate">
                          {audio.collection ? `${audio.collection} · #${audio.sort_order} · ` : ''}
                          {audio.duration_seconds ? formatDuration(audio.duration_seconds) : 'Length unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                        <button className="text-[#4a7fd4] hover:underline" onClick={() => togglePreview(audio)}>
                          {preview?.id === audio.id ? 'Close' : 'Listen'}
                        </button>
                        <button
                          className="text-[#4a7fd4] hover:underline"
                          onClick={() =>
                            setEditing({
                              id: audio.id,
                              draft: {
                                title: audio.title,
                                description: audio.description || '',
                                category: audio.category,
                                collection: audio.collection || '',
                                sort_order: String(audio.sort_order),
                              },
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-[#ef4444] hover:underline"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Delete "${audio.title}" and its file? This cannot be undone.`)) {
                              run(() => deleteAudio(audio))
                            }
                          }}
                        >
                          Delete
                        </button>
                        <PublishToggle
                          published={audio.is_published}
                          disabled={busy}
                          onChange={(next) => run(() => updateAudio(audio.id, { is_published: next }))}
                        />
                      </div>
                    </div>
                    {preview?.id === audio.id && (
                      <audio src={preview.url} controls autoPlay className="w-full mt-3" />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AudioFields({ draft, onChange }: { draft: AudioDraft; onChange: (draft: AudioDraft) => void }) {
  return (
    <>
      <Input label="Title" placeholder="e.g. Chapter 1 — The Decision" value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Category</label>
          <select className={fieldClass} value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value as AudioCategory })}>
            {AUDIO_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <Input label="Book / series title (optional)" placeholder="Groups chapters together" list="audio-collections" value={draft.collection} onChange={(e) => onChange({ ...draft, collection: e.target.value })} />
        <Input label="Chapter / order number" type="number" min={0} step={1} value={draft.sort_order} onChange={(e) => onChange({ ...draft, sort_order: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Description (optional)</label>
        <textarea className={fieldClass} rows={2} value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      </div>
    </>
  )
}
