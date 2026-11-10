'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { HomeButton } from '@/components/layout/HomeButton'
import { AUDIO_CATEGORIES, type AudioCategory } from '@/lib/constants/content'
import {
  getAudioProgress,
  getAudioUrl,
  getAudios,
  saveAudioProgress,
} from '@/lib/supabase/queries/content'
import { formatDuration } from '@/lib/utils/video'
import type { Audio, AudioProgress } from '@/lib/types/content'

const SPEEDS = [1, 1.25, 1.5, 2, 0.75]
const SAVE_EVERY_SECONDS = 15

export default function AudioLibraryPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const [audios, setAudios] = useState<Audio[]>([])
  const [progress, setProgress] = useState<Record<string, AudioProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<AudioCategory | null>(null)

  // Player
  const audioRef = useRef<HTMLAudioElement>(null)
  const [active, setActive] = useState<Audio | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  const activeRef = useRef<Audio | null>(null)
  const resumeAtRef = useRef(0)
  const lastSavedAtRef = useRef(0)
  const requestRef = useRef(0)
  const completedRef = useRef<Record<string, boolean>>({})
  // Id of the audio whose file is actually loaded in the <audio> element
  const loadedIdRef = useRef<string | null>(null)
  // True from the moment a different audio is picked until its file has
  // loaded. While true the element's position belongs to neither audio, so
  // nothing may be saved.
  const switchingRef = useRef(false)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [list, saved] = await Promise.all([getAudios(), getAudioProgress(client.id)])
        setAudios(list)
        setProgress(saved)
        for (const row of Object.values(saved)) completedRef.current[row.audio_id] = row.completed
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client, clientLoading])

  // Saves where the listener is up to. Called every few seconds while
  // playing, on pause, on finish, and when the page is hidden or closed.
  const persist = useCallback(
    (markCompleted = false) => {
      const el = audioRef.current
      const audio = activeRef.current
      if (!client || !el || !audio || switchingRef.current) return
      const completed = markCompleted || !!completedRef.current[audio.id]
      const position = markCompleted ? 0 : el.currentTime
      completedRef.current[audio.id] = completed
      lastSavedAtRef.current = el.currentTime
      setProgress((prev) => ({
        ...prev,
        [audio.id]: { audio_id: audio.id, position_seconds: Math.floor(position), completed },
      }))
      saveAudioProgress(client.id, audio.id, position, completed).catch((err) =>
        setError((err as Error).message)
      )
    },
    [client]
  )

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist()
    }
    const onLeave = () => persist()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onLeave)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onLeave)
    }
  }, [persist])

  const start = async (audio: Audio) => {
    const el = audioRef.current
    if (!el) return

    if (loadedIdRef.current === audio.id) {
      if (el.paused) el.play().catch(() => setPlaying(false))
      else el.pause()
      return
    }

    persist() // remember the spot in whatever was playing before
    switchingRef.current = true
    loadedIdRef.current = null
    el.pause()

    const request = ++requestRef.current
    activeRef.current = audio
    setActive(audio)
    setPreparing(true)
    setError(null)
    setTime(0)
    setDuration(audio.duration_seconds || 0)

    const saved = progress[audio.id]
    resumeAtRef.current = saved && !saved.completed ? saved.position_seconds : 0

    try {
      const url = await getAudioUrl(audio)
      if (request !== requestRef.current) return // listener already picked something else
      el.src = url
      loadedIdRef.current = audio.id
      el.load()
      // Some phones block playback that doesn't start directly from a tap.
      // If that happens the big play button is one more tap away.
      el.play().catch(() => setPlaying(false))
    } catch (err) {
      if (request === requestRef.current) setError((err as Error).message)
    } finally {
      if (request === requestRef.current) setPreparing(false)
    }
  }

  const onLoadedMetadata = () => {
    const el = audioRef.current
    if (!el) return
    if (Number.isFinite(el.duration)) setDuration(el.duration)
    el.playbackRate = speed
    const resumeAt = resumeAtRef.current
    // Don't resume inside the last few seconds — start that one over instead
    if (resumeAt > 0 && (!Number.isFinite(el.duration) || resumeAt < el.duration - 10)) {
      el.currentTime = resumeAt
    }
    resumeAtRef.current = 0
    lastSavedAtRef.current = el.currentTime
    switchingRef.current = false
  }

  const onTimeUpdate = () => {
    const el = audioRef.current
    if (!el) return
    setTime(el.currentTime)
    if (Math.abs(el.currentTime - lastSavedAtRef.current) >= SAVE_EVERY_SECONDS) persist()
  }

  const onEnded = () => {
    setPlaying(false)
    persist(true)
    // Audiobooks: carry straight on to the next chapter of the same book
    const current = activeRef.current
    if (!current?.collection) return
    const chapters = audios
      .filter((a) => a.category === current.category && a.collection === current.collection)
      .sort((a, b) => a.sort_order - b.sort_order)
    const next = chapters[chapters.findIndex((a) => a.id === current.id) + 1]
    if (next) start(next)
  }

  const onAudioError = () => {
    // The element also fires 'error' while it has no source yet — ignore that
    if (!audioRef.current?.getAttribute('src')) return
    setPlaying(false)
    // Forget the loaded file so the next tap fetches a fresh link and retries
    switchingRef.current = true
    loadedIdRef.current = null
    setError('This audio could not be played. Check your connection and tap it again.')
  }

  const seekTo = (seconds: number) => {
    const el = audioRef.current
    if (!el) return
    const max = Number.isFinite(el.duration) ? el.duration : duration
    el.currentTime = Math.min(Math.max(0, seconds), max || seconds)
    setTime(el.currentTime)
  }

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  // Categories that actually have audios, in the fixed display order
  const categories = useMemo(
    () => AUDIO_CATEGORIES.filter((c) => audios.some((a) => a.category === c.value)),
    [audios]
  )
  const currentCategory = category ?? categories[0]?.value ?? null

  // Within a category: books/series (grouped, chapters in order) first, then standalone audios
  const groups = useMemo(() => {
    const items = audios.filter((a) => a.category === currentCategory)
    const byCollection = new Map<string, Audio[]>()
    for (const audio of items) {
      const key = audio.collection || ''
      byCollection.set(key, [...(byCollection.get(key) || []), audio])
    }
    return Array.from(byCollection.entries())
      .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
      .map(([name, list]) => ({ name, list: [...list].sort((a, b) => a.sort_order - b.sort_order) }))
  }, [audios, currentCategory])

  if (checking || clientLoading || loading) return <PageLoader />

  return (
    <div className={`min-h-screen bg-[#0a0a0f] ${active ? 'pb-56' : 'pb-10'}`}>

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="max-w-2xl mx-auto">
          <HomeButton />
          <p className="text-[#00d4d4] text-xs tracking-widest uppercase mb-1">Audio Library</p>
          <h1 className="text-white text-2xl font-semibold">Listen &amp; grow</h1>
          <p className="text-white/40 text-xs mt-1">Picks up where you left off</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-4 flex justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline flex-shrink-0">Dismiss</button>
          </div>
        )}

        {audios.length === 0 && !error && (
          <div className="bg-white/5 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-2">🎧</div>
            <p className="text-sm font-medium text-white">No audios yet</p>
            <p className="text-xs text-white/40 mt-1">Coach Mohit is recording your first ones. Check back soon.</p>
          </div>
        )}

        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
                  currentCategory === c.value
                    ? 'bg-[#00d4d4] border-[#00d4d4] text-[#0a0a0f]'
                    : 'border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.name || 'standalone'} className="mb-5">
            {group.name && (
              <div className="flex items-baseline justify-between mb-2 px-1">
                <p className="text-white text-sm font-medium">{group.name}</p>
                <p className="text-white/30 text-xs">
                  {group.list.filter((a) => progress[a.id]?.completed).length} of {group.list.length} done
                </p>
              </div>
            )}
            <div className="bg-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
              {group.list.map((audio, index) => {
                const saved = progress[audio.id]
                const isActive = active?.id === audio.id
                const total = audio.duration_seconds || 0
                const listened = isActive ? time : saved?.position_seconds || 0
                const inProgress = !saved?.completed && listened > 0 && total > 0
                return (
                  <button
                    key={audio.id}
                    onClick={() => start(audio)}
                    className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        isActive ? 'bg-[#00d4d4] text-[#0a0a0f]' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {isActive && playing ? '❚❚' : saved?.completed && !isActive ? '✓' : group.name ? index + 1 : '▶'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm truncate ${isActive ? 'text-[#00d4d4]' : 'text-white'}`}>
                        {audio.title}
                      </span>
                      <span className="block text-xs text-white/30 mt-0.5 truncate">
                        {inProgress
                          ? `${formatDuration(Math.max(0, total - listened))} left`
                          : total
                            ? formatDuration(total)
                            : audio.description || ''}
                      </span>
                      {inProgress && (
                        <span className="block w-full h-0.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <span
                            className="block h-full bg-[#00d4d4] rounded-full"
                            style={{ width: `${Math.min(100, (listened / total) * 100)}%` }}
                          />
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* One audio element for the whole page, driven by the player below */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false)
          // Reaching the end also fires 'pause' — onEnded saves that case
          if (!audioRef.current?.ended) persist()
        }}
        onEnded={onEnded}
        onError={onAudioError}
      />

      {/* Player */}
      {active && (
        <div className="fixed bottom-0 inset-x-0 bg-[#1a1f3a] border-t border-white/10 px-5 pt-4 pb-6 z-40">
          <div className="max-w-2xl mx-auto">
            <p className="text-white text-sm font-medium truncate">{active.title}</p>
            <p className="text-white/40 text-xs truncate mb-3">
              {active.collection || AUDIO_CATEGORIES.find((c) => c.value === active.category)?.label}
            </p>

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(time, duration || 0)}
              onChange={(e) => seekTo(Number(e.target.value))}
              disabled={!duration || preparing}
              aria-label="Seek"
              className="w-full accent-[#00d4d4]"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1 mb-3">
              <span>{formatDuration(time)}</span>
              <span>{duration ? formatDuration(duration) : '--:--'}</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={cycleSpeed}
                className="w-14 text-left text-xs text-white/50 hover:text-white transition-colors"
                aria-label="Playback speed"
              >
                {speed}×
              </button>
              <div className="flex items-center gap-5">
                <button onClick={() => seekTo(time - 30)} className="text-white/40 text-xs hover:text-white/70 transition-colors">
                  -30s
                </button>
                <button
                  onClick={() => start(active)}
                  disabled={preparing}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="w-14 h-14 rounded-full bg-[#00d4d4] flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                >
                  {preparing ? (
                    <span className="w-5 h-5 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                  ) : playing ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0a0a0f">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0a0a0f">
                      <polygon points="8,5 19,12 8,19" />
                    </svg>
                  )}
                </button>
                <button onClick={() => seekTo(time + 30)} className="text-white/40 text-xs hover:text-white/70 transition-colors">
                  +30s
                </button>
              </div>
              <span className="w-14" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
