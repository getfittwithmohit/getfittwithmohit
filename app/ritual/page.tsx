'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

const AUDIO_URL = process.env.NEXT_PUBLIC_STRANGEST_SECRET_URL || ''

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function getCurrentQuarter() {
  const q = Math.floor(new Date().getMonth() / 3) + 1
  return { quarter: `Q${q}`, year: new Date().getFullYear() }
}

export default function RitualPage() {
  const { checking } = useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [streakData, setStreakData] = useState<any>(null)
  const [finishing, setFinishing] = useState(false)
  const [finished, setFinished] = useState(false)

  // Step: Strangest Secret
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioTime, setAudioTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [listenedEnough, setListenedEnough] = useState(false)

  // Step: Goal Card
  const [goalCard, setGoalCard] = useState<any>(null)

  // Step: Affirmations
  const [affirmationText, setAffirmationText] = useState('')
  const [affirmationUrl, setAffirmationUrl] = useState('')
  const [generatingAff, setGeneratingAff] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadingRec, setUploadingRec] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<any>(null)
  const affAudioRef = useRef<HTMLAudioElement>(null)
  const [affPlaying, setAffPlaying] = useState(false)

  // Step: 20 Goals
  const [goalsPage, setGoalsPage] = useState(1)
  const [goals, setGoals] = useState<string[]>(Array(20).fill(''))
  const [savingGoals, setSavingGoals] = useState(false)

  // Step: Codex
  const [codexSection, setCodexSection] = useState('')

  useEffect(() => {
    async function load() {
      const c = await getCurrentClient()
      if (!c) { setLoading(false); return }
      setClient(c)

      const today = new Date().toISOString().split('T')[0]
      const { quarter, year } = getCurrentQuarter()

      const [ritualRes, streakRes, goalRes, affRes, codexRes] = await Promise.all([
        supabase.from('daily_rituals').select('*').eq('client_id', c.id).eq('date', today).maybeSingle(),
        supabase.from('ritual_streaks').select('*').eq('client_id', c.id).maybeSingle(),
        supabase.from('goal_cards').select('*').eq('client_id', c.id).eq('quarter', quarter).eq('year', year).maybeSingle(),
        supabase.from('affirmations').select('generated_text, audio_url, audio_path').eq('client_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('codex_data').select('generated_codex').eq('client_id', c.id).maybeSingle(),
      ])

      setStreakData(streakRes.data)

      if (ritualRes.data?.completed_at) {
        setAlreadyDone(true)
        setLoading(false)
        return
      }

      // Pre-fill completed steps from today's partial progress
      if (ritualRes.data) {
        const done: string[] = []
        if (ritualRes.data.strangest_secret_done) done.push('secret')
        if (ritualRes.data.goal_card_done) done.push('goals')
        if (ritualRes.data.affirmations_done) done.push('affirmations')
        if (ritualRes.data.goals_done) done.push('write')
        if (ritualRes.data.codex_done) done.push('codex')
        setCompletedSteps(done)
      }

      setGoalCard(goalRes.data)
      setAffirmationText(affRes.data?.generated_text || '')

      if (affRes.data?.audio_path) {
        const { data: urlData } = await supabase.storage
          .from('affirmations')
          .createSignedUrl(affRes.data.audio_path, 60 * 60 * 8)
        if (urlData?.signedUrl) setAffirmationUrl(urlData.signedUrl)
      }

      const sections = codexRes.data?.generated_codex?.sections
      if (sections?.length) {
        setCodexSection(sections[0].content?.split('\n\n')[0] || '')
      }

      setLoading(false)
    }
    load()
  }, [])

  // Audio tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setAudioTime(audio.currentTime)
      if (audio.currentTime >= 300) setListenedEnough(true)
    }
    const onDuration = () => setAudioDuration(audio.duration)
    const onEnded = () => { setIsPlaying(false); setListenedEnough(true) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [loading])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  const generateAffirmations = async () => {
  if (!client) return
  setGeneratingAff(true)
  try {
    const res = await fetch('/api/affirmations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('Generate error:', data.error)
      window.alert('Failed to generate affirmations. Please try again.')
      return
    }
    if (data.text) setAffirmationText(data.text)
  } catch (err) {
    console.error(err)
    window.alert('Something went wrong. Please try again.')
  } finally {
    setGeneratingAff(false)
  }
}

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start()
      setRecording(true)
      setRecordingTime(0)
      recTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      window.alert('Microphone access is required to record affirmations.')
    }
  }

  const stopRecording = async () => {
    const mr = mediaRecorderRef.current
    if (!mr) return
    setUploadingRec(true)
    clearInterval(recTimerRef.current)
    await new Promise<void>(resolve => {
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const path = `${client.id}/${Date.now()}.webm`
          await supabase.storage.from('affirmations').upload(path, blob, { contentType: 'audio/webm' })
          const { data: urlData } = await supabase.storage.from('affirmations').createSignedUrl(path, 60 * 60 * 8)
          const signedUrl = urlData?.signedUrl || ''
          await supabase.from('affirmations').upsert({
            client_id: client.id,
            audio_path: path,
            audio_url: signedUrl,
            generated_text: affirmationText,
            is_active: true,
            duration_seconds: recordingTime,
          }, { onConflict: 'client_id' })
          setAffirmationUrl(signedUrl)
        } catch (err) { console.error(err) }
        resolve()
      }
      mr.stop()
      mr.stream.getTracks().forEach(t => t.stop())
    })
    setRecording(false)
    setUploadingRec(false)
  }

  const markDone = (id: string) => {
    setCompletedSteps(prev => prev.includes(id) ? prev : [...prev, id])
    setExpanded(null)
  }

  const saveGoals = async () => {
    if (!client) return
    setSavingGoals(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('daily_goals').upsert({
      client_id: client.id,
      date: today,
      page1_goals: goals.slice(0, 10).filter(Boolean),
      page2_goals: goals.slice(10).filter(Boolean),
      completed_at: new Date().toISOString(),
    }, { onConflict: 'client_id,date' })
    setSavingGoals(false)
    markDone('write')
  }

  const completeRitual = async () => {
    if (!client) return
    setFinishing(true)
    try {
      const res = await fetch('/api/ritual/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          steps: [
            completedSteps.includes('secret') ? 1 : null,
            completedSteps.includes('goals') ? 2 : null,
            completedSteps.includes('affirmations') ? 3 : null,
            completedSteps.includes('write') ? 4 : null,
            completedSteps.includes('codex') ? 5 : null,
          ].filter(Boolean),
        }),
      })
      const data = await res.json()
      setStreakData({ current_streak: data.streak, longest_streak: data.longest })
      setFinished(true)
    } catch (err) { console.error(err) }
    finally { setFinishing(false) }
  }

  if (checking || loading) return <PageLoader />

  const firstName = client?.full_name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]

  // Already done or just finished
  if (alreadyDone || finished) {
    const streak = streakData?.current_streak || 1
    const longest = streakData?.longest_streak || 1
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-6">🔥</div>
          <h1 className="text-4xl font-bold text-white mb-1">{streak}</h1>
          <p className="text-[#00d4d4] text-xs tracking-widest uppercase mb-1">
            {streak === 1 ? 'day streak' : 'days strong'}
          </p>
          {longest > streak && (
            <p className="text-white/20 text-xs mb-8">Personal best: {longest} days</p>
          )}
          {!alreadyDone && (
            <p className="text-white/50 text-sm leading-relaxed mb-2">
              Ritual complete. You showed up. That is everything.
            </p>
          )}
          {alreadyDone && (
            <p className="text-white/50 text-sm leading-relaxed mb-2">
              Already done today. Come back tomorrow and keep the fire burning.
            </p>
          )}
          <p className="text-white/20 text-xs mb-10">Keep showing up. Every day compounds.</p>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  const allDone = completedSteps.length === 5

  const ITEMS = [
    { id: 'secret', emoji: '🎧', label: 'The Strangest Secret', sub: 'Listen · Earl Nightingale · ~30 mins' },
    { id: 'goals', emoji: '🎯', label: 'Goal Card', sub: 'Read your quarterly goals out loud' },
    { id: 'affirmations', emoji: '🎙️', label: 'Affirmations', sub: 'Listen to your voice · Your identity' },
    { id: 'write', emoji: '✍️', label: '20 Goals', sub: 'Write fresh · 10 per page · Present tense' },
    { id: 'codex', emoji: '📖', label: 'Your Codex', sub: 'Read your personal transformation biography' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <audio ref={audioRef} src={AUDIO_URL} preload="metadata" />
      {affirmationUrl && <audio ref={affAudioRef} src={affirmationUrl} />}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 max-w-lg mx-auto">
        <button
          onClick={() => window.location.href = '/home'}
          className="text-white/25 text-xs mb-6 block hover:text-white/50 transition-colors"
        >
          ← Home
        </button>
        <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase mb-1">
          {dayName} · Daily Ritual
        </p>
        <h1 className="text-white text-2xl font-semibold mb-1">
          {greeting}, {firstName}.
        </h1>
        <p className="text-white/30 text-sm">
          {completedSteps.length === 0
            ? 'The world is quiet. This time is yours.'
            : completedSteps.length < 5
              ? `${completedSteps.length} of 5 complete · Keep going.`
              : 'All done. Complete your ritual below.'}
        </p>

        {/* Streak badge */}
        {streakData?.current_streak > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-lg">🔥</span>
            <span className="text-white/50 text-xs">{streakData.current_streak} day streak</span>
          </div>
        )}
      </div>

      {/* Ritual list */}
      <div className="px-4 pb-6 max-w-lg mx-auto space-y-2">

        {ITEMS.map((item) => {
          const done = completedSteps.includes(item.id)
          const open = expanded === item.id

          return (
            <div
              key={item.id}
              className="rounded-2xl border transition-all duration-300 overflow-hidden"
              style={{
                borderColor: done
                  ? 'rgba(0,212,212,0.3)'
                  : open
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.07)',
                background: done
                  ? 'rgba(0,212,212,0.05)'
                  : open
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(open ? null : item.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-[#00d4d4]' : 'text-white'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5 truncate">{item.sub}</p>
                </div>
                {done ? (
                  <div className="w-6 h-6 rounded-full bg-[#00d4d4] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
                      <path d="M5 8l5 5 5-5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {open && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">

                  {/* ── STRANGEST SECRET ── */}
                  {item.id === 'secret' && (
                    <div>
                      <p className="text-white/40 text-xs leading-relaxed mb-5">
                        Listen with your eyes closed. Let every word land before the day begins.
                      </p>

                      <div className="bg-white/5 rounded-2xl p-5 mb-4">
                        {/* Waveform */}
                        <div className="flex items-center justify-center gap-0.5 h-8 mb-4">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full"
                              style={{
                                height: isPlaying ? `${8 + (i % 7) * 4}px` : '4px',
                                background: isPlaying ? '#00d4d4' : 'rgba(255,255,255,0.15)',
                                transition: 'height 0.3s ease',
                                animationDelay: `${i * 50}ms`,
                              }}
                            />
                          ))}
                        </div>

                        {/* Progress */}
                        <div className="flex justify-between text-xs text-white/25 mb-2">
                          <span>{formatTime(audioTime)}</span>
                          <span>{audioDuration ? formatTime(audioDuration) : '30:00'}</span>
                        </div>
                        <div className="w-full h-0.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                          <div
                            className="h-full bg-[#00d4d4] rounded-full transition-all duration-1000"
                            style={{ width: `${audioDuration ? (audioTime / audioDuration) * 100 : 0}%` }}
                          />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30) }}
                            className="text-white/30 text-xs hover:text-white/60 transition-colors"
                          >
                            -30s
                          </button>
                          <button
                            onClick={toggleAudio}
                            className="w-14 h-14 rounded-full bg-[#00d4d4] flex items-center justify-center transition-transform active:scale-95"
                          >
                            {isPlaying ? (
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
                          <button
                            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 30) }}
                            className="text-white/30 text-xs hover:text-white/60 transition-colors"
                          >
                            +30s
                          </button>
                        </div>
                      </div>

                      <p className="text-white/20 text-xs text-center mb-4">
                        {listenedEnough ? '✓ Ready to mark complete' : 'Listen for at least 5 minutes to mark complete'}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => markDone('secret')}
                          disabled={!listenedEnough}
                          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-25"
                          style={{ background: '#00d4d4', color: '#0a0a0f' }}
                        >
                          Mark complete ✓
                        </button>
                        <button
                          onClick={() => markDone('secret')}
                          className="px-4 py-3 rounded-xl text-xs text-white/25 hover:text-white/50 transition-colors border border-white/10"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── GOAL CARD ── */}
                  {item.id === 'goals' && (
                    <div>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">
                        Read these out loud. Slowly. With full conviction they are already done.
                      </p>

                      {goalCard ? (
                        <div className="space-y-3 mb-4">
                          {[
                            { label: 'Goal One', text: goalCard.goal1_text, deadline: goalCard.goal1_deadline },
                            { label: 'Goal Two', text: goalCard.goal2_text, deadline: goalCard.goal2_deadline },
                          ].map((g, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-4">
                              <p className="text-[#00d4d4] text-xs tracking-widest uppercase mb-2">{g.label}</p>
                              <p className="text-white text-sm leading-relaxed">{g.text}</p>
                              {g.deadline && <p className="text-white/25 text-xs mt-2">By: {g.deadline}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/5 rounded-xl p-4 text-center mb-4">
                          <p className="text-white/30 text-xs mb-3">No goal card yet.</p>
                          <button
                            onClick={() => window.location.href = '/ritual/goal-card'}
                            className="text-[#00d4d4] text-xs underline underline-offset-2"
                          >
                            Set up my goal card →
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => markDone('goals')}
                          className="flex-1 py-3 rounded-xl text-sm font-medium"
                          style={{ background: '#00d4d4', color: '#0a0a0f' }}
                        >
                          I've read it ✓
                        </button>
                        <button
                          onClick={() => window.location.href = '/ritual/goal-card'}
                          className="px-4 py-3 rounded-xl text-xs text-white/25 hover:text-white/50 border border-white/10 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── AFFIRMATIONS ── */}
                  {item.id === 'affirmations' && (
                    <div>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">
                        Your own voice is the most powerful signal your mind receives. Hear yourself say who you are becoming.
                      </p>

                      {!affirmationText && !generatingAff && (
                        <button
                          onClick={generateAffirmations}
                          className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-sm text-white/50 hover:border-[#00d4d4]/40 transition-colors mb-3"
                        >
                          Generate my affirmations →
                        </button>
                      )}

                      {generatingAff && (
                        <div className="flex items-center gap-3 py-3 mb-3">
                          <div className="w-4 h-4 border border-white/20 border-t-[#00d4d4] rounded-full animate-spin flex-shrink-0" />
                          <p className="text-white/30 text-xs">Generating your affirmations...</p>
                        </div>
                      )}

                      {affirmationText && (
                        <>
                          {/* Affirmation preview */}
                          <div className="bg-white/5 rounded-xl p-4 max-h-32 overflow-y-auto mb-3">
                            <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line">
                              {affirmationText.split('\n').slice(0, 10).join('\n')}...
                            </p>
                          </div>

                          {/* Player */}
                          {affirmationUrl && (
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 mb-3">
                              <button
                                onClick={() => {
                                  const audio = affAudioRef.current
                                  if (!audio) return
                                  if (affPlaying) { audio.pause(); setAffPlaying(false) }
                                  else { audio.play(); setAffPlaying(true); audio.onended = () => setAffPlaying(false) }
                                }}
                                className="w-10 h-10 rounded-full bg-[#00d4d4] flex items-center justify-center flex-shrink-0"
                              >
                                {affPlaying ? (
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#0a0a0f">
                                    <rect x="6" y="5" width="4" height="14" rx="1" />
                                    <rect x="14" y="5" width="4" height="14" rx="1" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#0a0a0f">
                                    <polygon points="8,5 19,12 8,19" />
                                  </svg>
                                )}
                              </button>
                              <div>
                                <p className="text-white/60 text-xs font-medium">Your affirmation recording</p>
                                <p className="text-white/25 text-xs">{affPlaying ? 'Playing...' : 'Tap to listen'}</p>
                              </div>
                            </div>
                          )}

                          {/* Record */}
                          {!recording && !uploadingRec && (
                            <button
                              onClick={startRecording}
                              className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-xs text-white/40 hover:border-red-500/40 hover:text-red-400 transition-all flex items-center justify-center gap-2 mb-3"
                            >
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              {affirmationUrl ? 'Re-record' : 'Record my affirmations'}
                            </button>
                          )}

                          {recording && (
                            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-400 text-xs font-medium">{formatTime(recordingTime)}</span>
                              </div>
                              <button
                                onClick={stopRecording}
                                className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium"
                              >
                                Stop
                              </button>
                            </div>
                          )}

                          {uploadingRec && (
                            <div className="flex items-center gap-2 py-2 mb-3">
                              <div className="w-3 h-3 border border-white/20 border-t-[#00d4d4] rounded-full animate-spin" />
                              <p className="text-white/25 text-xs">Saving recording...</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => markDone('affirmations')}
                          className="flex-1 py-3 rounded-xl text-sm font-medium"
                          style={{ background: '#00d4d4', color: '#0a0a0f' }}
                        >
                          {affirmationUrl ? "I've listened ✓" : 'Mark complete ✓'}
                        </button>
                        <button
                          onClick={() => markDone('affirmations')}
                          className="px-4 py-3 rounded-xl text-xs text-white/25 hover:text-white/50 border border-white/10 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── 20 GOALS ── */}
                  {item.id === 'write' && (
                    <div>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">
                        Do not look at yesterday's list. Write fresh. Present tense — as if already achieved.
                      </p>

                      {/* Page toggle */}
                      <div className="flex bg-white/5 rounded-xl p-1 mb-4">
                        {[1, 2].map(p => (
                          <button
                            key={p}
                            onClick={() => setGoalsPage(p)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: goalsPage === p ? '#00d4d4' : 'transparent',
                              color: goalsPage === p ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            Page {p} (Goals {p === 1 ? '1–10' : '11–20'})
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2 mb-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const idx = goalsPage === 1 ? i : i + 10
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[#00d4d4] text-xs font-medium w-5 text-right flex-shrink-0">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                value={goals[idx]}
                                onChange={e => {
                                  const updated = [...goals]
                                  updated[idx] = e.target.value
                                  setGoals(updated)
                                }}
                                placeholder={`Goal ${idx + 1}...`}
                                className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/15 focus:outline-none focus:border-[#00d4d4]/30 transition-colors"
                              />
                            </div>
                          )
                        })}
                      </div>

                      <button
                        onClick={saveGoals}
                        disabled={savingGoals}
                        className="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                        style={{ background: '#00d4d4', color: '#0a0a0f' }}
                      >
                        {savingGoals ? 'Saving...' : 'Save & complete ✓'}
                      </button>
                    </div>
                  )}

                  {/* ── CODEX ── */}
                  {item.id === 'codex' && (
                    <div>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">
                        Open your biography. Read it fully. Let it remind you who you are and why you started.
                      </p>

                      {codexSection ? (
                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                          <p className="text-white/50 text-xs leading-relaxed line-clamp-4">
                            {codexSection}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
                          <p className="text-white/25 text-xs">Codex not written yet.</p>
                        </div>
                      )}

                      <button
                        onClick={() => window.open('/codex/view', '_blank')}
                        className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-xs text-white/50 hover:border-[#00d4d4]/40 transition-colors mb-2"
                      >
                        Open full Codex →
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => markDone('codex')}
                          className="flex-1 py-3 rounded-xl text-sm font-medium"
                          style={{ background: '#00d4d4', color: '#0a0a0f' }}
                        >
                          I've read it ✓
                        </button>
                        <button
                          onClick={() => markDone('codex')}
                          className="px-4 py-3 rounded-xl text-xs text-white/25 hover:text-white/50 border border-white/10 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Complete ritual button */}
      <div className="px-4 pb-10 max-w-lg mx-auto">
        {allDone ? (
          <button
            onClick={completeRitual}
            disabled={finishing}
            className="w-full py-4 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ background: '#00d4d4', color: '#0a0a0f' }}
          >
            {finishing ? 'Completing...' : '🔥 Complete my ritual'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-white/20 text-xs mb-3">
              {5 - completedSteps.length} item{5 - completedSteps.length !== 1 ? 's' : ''} remaining
            </p>
            <button
              onClick={completeRitual}
              disabled={finishing}
              className="w-full py-4 rounded-2xl text-sm font-medium text-white/30 border border-white/10 disabled:opacity-50"
            >
              {finishing ? 'Completing...' : 'Complete ritual anyway'}
            </button>
          </div>
        )}
      </div>

    </div>
  )
}