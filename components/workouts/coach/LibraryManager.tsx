'use client'

import { useEffect, useMemo, useState } from 'react'
import { getExercises, saveExercise, type ExerciseInput } from '@/lib/supabase/queries/workouts'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { youtubeSearchUrl } from '@/lib/utils/workouts'
import { LOG_TYPE_LABEL, MUSCLE_GROUPS, type Exercise, type LogType, type Location } from '@/lib/types/workouts'

const field = 'w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]'
const label = 'text-xs font-medium text-[#64748b]'

const EMPTY: ExerciseInput = {
  name: '',
  muscle_group: 'Chest',
  equipment: '',
  locations: ['gym'],
  log_type: 'weight_reps',
  video_url: '',
  cues: ['', '', ''],
  weight_step: 2.5,
  home_alt_id: null,
  hotel_alt_id: null,
  is_active: true,
}

export function LibraryManager() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string>('All')
  const [onlyMissingVideo, setOnlyMissingVideo] = useState(false)
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<ExerciseInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [savedNote, setSavedNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getExercises()
      .then((data) => { if (!cancelled) setExercises(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exercises.filter(
      (e) =>
        (muscle === 'All' || e.muscle_group === muscle) &&
        (!onlyMissingVideo || !e.video_url) &&
        (!q || e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q))
    )
  }, [exercises, search, muscle, onlyMissingVideo])

  const missingVideos = exercises.filter((e) => !e.video_url && e.is_active).length
  const nameOf = (id: string | null) => exercises.find((e) => e.id === id)?.name || '—'

  const open = (ex: Exercise | 'new') => {
    setSavedNote(null)
    setError(null)
    if (ex === 'new') {
      setSelectedId('new')
      setDraft(EMPTY)
      return
    }
    setSelectedId(ex.id)
    setDraft({
      name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      locations: ex.locations,
      log_type: ex.log_type,
      video_url: ex.video_url || '',
      cues: [...ex.cues, '', '', ''].slice(0, Math.max(3, ex.cues.length)),
      weight_step: ex.weight_step,
      home_alt_id: ex.home_alt_id,
      hotel_alt_id: ex.hotel_alt_id,
      is_active: ex.is_active,
    })
  }

  const save = async () => {
    if (!draft.name.trim()) return setError('Give the exercise a name.')
    if (draft.video_url?.trim() && !getVideoEmbedUrl(draft.video_url)) {
      return setError('That link is not a YouTube video link. Copy the link from the video’s Share button.')
    }
    if (!draft.locations.length) return setError('Pick at least one place it can be done.')
    setSaving(true)
    setError(null)
    try {
      const saved = await saveExercise(draft, selectedId && selectedId !== 'new' ? selectedId : undefined)
      setExercises((list) =>
        [...list.filter((e) => e.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name))
      )
      setSelectedId(saved.id)
      setSavedNote('Saved')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleLocation = (loc: Location) =>
    setDraft((d) => ({
      ...d,
      locations: d.locations.includes(loc) ? d.locations.filter((l) => l !== loc) : [...d.locations, loc],
    }))

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading library…</p>

  const embed = getVideoEmbedUrl(draft.video_url)

  return (
    <div className="flex flex-wrap gap-5 items-start">
      {/* List */}
      <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${exercises.length} exercises`}
            aria-label="Search exercises"
            className={`${field} flex-1 min-w-[200px] h-10`}
          />
          <button
            onClick={() => open('new')}
            className="h-10 px-4 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium hover:bg-[#141930]"
          >
            + Add exercise
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...MUSCLE_GROUPS].map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              className={`h-8 px-3 rounded-full text-xs font-medium border ${
                muscle === m ? 'bg-[#1a1f3a] border-[#1a1f3a] text-white' : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-[#00D4E8]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {missingVideos > 0 && (
          <button
            onClick={() => setOnlyMissingVideo((v) => !v)}
            className="text-left bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-4 py-2.5 text-sm text-[#9a3412]"
          >
            {onlyMissingVideo
              ? `Showing the ${missingVideos} exercises without a demo video — tap to show all`
              : `${missingVideos} exercises still need a demo video — tap to see them`}
          </button>
        )}

        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#64748b] border-b border-[#e2e8f0]">
                <th className="px-4 py-2.5 font-semibold">Exercise</th>
                <th className="px-2 py-2.5 font-semibold">Muscle</th>
                <th className="px-2 py-2.5 font-semibold">Equipment</th>
                <th className="px-2 py-2.5 font-semibold">Logs</th>
                <th className="px-4 py-2.5 font-semibold">Video</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => open(e)}
                  className={`border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${selectedId === e.id ? 'bg-[#ecfeff]' : ''} ${e.is_active ? '' : 'opacity-50'}`}
                >
                  <td className="px-4 py-2.5 font-medium text-[#0f172a]">{e.name}</td>
                  <td className="px-2 py-2.5 text-[#475569]">{e.muscle_group}</td>
                  <td className="px-2 py-2.5 text-[#475569]">{e.equipment}</td>
                  <td className="px-2 py-2.5 text-[#475569]">{LOG_TYPE_LABEL[e.log_type]}</td>
                  <td className="px-4 py-2.5">
                    {e.video_url ? <span className="text-[#15803d] font-medium">Linked</span> : <span className="text-[#c2410c]">Missing</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[#94a3b8] py-10">No exercises match</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-[1_1_340px] min-w-0 bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-4">
        {selectedId === null ? (
          <p className="text-sm text-[#94a3b8] text-center py-10">Select an exercise to edit it, or add a new one.</p>
        ) : (
          <>
            <p className="text-base font-semibold text-[#0f172a]">{selectedId === 'new' ? 'New exercise' : draft.name}</p>
            {error && <p className="text-sm text-[#ef4444] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <label className="flex flex-col gap-1.5">
              <span className={label}>Name</span>
              <input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className={label}>Demo video (YouTube link)</span>
              {embed && (
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe src={embed} title={`${draft.name} demo`} className="absolute inset-0 w-full h-full" allowFullScreen />
                </div>
              )}
              <input
                className={field}
                placeholder="https://youtu.be/…"
                value={draft.video_url || ''}
                onChange={(e) => setDraft({ ...draft, video_url: e.target.value })}
              />
              <a
                href={youtubeSearchUrl(draft.name || 'exercise')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2563eb] underline underline-offset-2 w-fit"
              >
                Find demo on YouTube ↗
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Muscle group</span>
                <select className={field} value={draft.muscle_group} onChange={(e) => setDraft({ ...draft, muscle_group: e.target.value as Exercise['muscle_group'] })}>
                  {MUSCLE_GROUPS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Client logs</span>
                <select className={field} value={draft.log_type} onChange={(e) => setDraft({ ...draft, log_type: e.target.value as LogType })}>
                  {(Object.keys(LOG_TYPE_LABEL) as LogType[]).map((t) => <option key={t} value={t}>{LOG_TYPE_LABEL[t]}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Equipment</span>
                <input className={field} value={draft.equipment} placeholder="Dumbbell" onChange={(e) => setDraft({ ...draft, equipment: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Weight step (kg)</span>
                <input
                  className={field}
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={draft.weight_step}
                  disabled={draft.log_type !== 'weight_reps'}
                  onChange={(e) => setDraft({ ...draft, weight_step: Number(e.target.value) || 2.5 })}
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>Can be done at</span>
              <div className="flex gap-2">
                {(['gym', 'home', 'hotel'] as Location[]).map((loc) => (
                  <label key={loc} className="flex items-center gap-1.5 text-sm capitalize">
                    <input type="checkbox" checked={draft.locations.includes(loc)} onChange={() => toggleLocation(loc)} className="accent-[#00a3b5]" />
                    {loc}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>Form cues (shown to the client)</span>
              {draft.cues.map((cue, i) => (
                <input
                  key={i}
                  className={field}
                  value={cue}
                  placeholder={`Cue ${i + 1}`}
                  onChange={(e) => setDraft({ ...draft, cues: draft.cues.map((c, j) => (j === i ? e.target.value : c)) })}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['home_alt_id', 'hotel_alt_id'] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className={label}>{key === 'home_alt_id' ? 'Home swap' : 'Hotel swap'}</span>
                  <select className={field} value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value || null })}>
                    <option value="">None</option>
                    {exercises
                      .filter((e) => e.id !== selectedId && e.locations.includes(key === 'home_alt_id' ? 'home' : 'hotel'))
                      .map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {selectedId !== 'new' && (draft.home_alt_id || draft.hotel_alt_id) && (
              <p className="text-xs text-[#94a3b8] -mt-2">
                Home: {nameOf(draft.home_alt_id)} · Hotel: {nameOf(draft.hotel_alt_id)}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: !e.target.checked })} />
              Hide from clients (archived)
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save exercise'}
              </button>
              {savedNote && <span className="text-sm text-[#15803d]">✓ {savedNote}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
