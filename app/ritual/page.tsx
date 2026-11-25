'use client'

import { Icon, type IconName } from '@/components/ui/Icon'
import { toast } from '@/lib/ui/feedback'
import { useState, useEffect, useRef } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { todayIST } from '@/lib/utils/istDate'
import { go } from '@/lib/ui/navigate'
import { Screen, T } from '@/components/ui/ios'

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

  useEffect(() => {
    async function load() {
      const c = await getCurrentClient()
      if (!c) { setLoading(false); return }
      setClient(c)

      const today = todayIST()
      const { quarter, year } = getCurrentQuarter()

      const [ritualRes, streakRes, goalRes, affRes] = await Promise.all([
        supabase.from('daily_rituals').select('*').eq('client_id', c.id).eq('date', today).maybeSingle(),
        supabase.from('ritual_streaks').select('*').eq('client_id', c.id).maybeSingle(),
        supabase.from('goal_cards').select('*').eq('client_id', c.id).eq('quarter', quarter).eq('year', year).maybeSingle(),
        supabase.from('affirmations').select('generated_text, audio_url, audio_path').eq('client_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
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
      toast('Failed to generate affirmations. Please try again.')
      return
    }
    if (data.text) setAffirmationText(data.text)
  } catch (err) {
    console.error(err)
    toast('Something went wrong. Please try again.')
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
      toast('Microphone access is required to record affirmations.')
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
    const today = todayIST()
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

  const primary = 'w-full min-h-[50px] rounded-2xl text-base font-semibold disabled:opacity-40 flex items-center justify-center gap-2'
  const secondary = 'min-h-[50px] px-5 rounded-2xl text-base font-medium border'
  const primaryStyle = { background: T.navy, color: T.cyan }
  const secondaryStyle = { borderColor: T.line, color: T.sec, background: '#fff' }

  // Already done or just finished
  if (alreadyDone || finished) {
    const streak = streakData?.current_streak || 1
    const longest = streakData?.longest_streak || 1
    return (
      <Screen>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center gap-2 px-4">
          <div className="gfm-pop w-24 h-24 rounded-full flex items-center justify-center mb-2" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <Icon name="flame" size={52} strokeWidth={1.8} />
          </div>
          <p className="m-0 text-6xl font-extrabold tracking-tight">{streak}</p>
          <p className="m-0 text-sm font-bold tracking-[0.12em] uppercase" style={{ color: T.teal }}>{streak === 1 ? 'day streak' : 'days strong'}</p>
          {longest > streak && <p className="m-0 text-[15px]" style={{ color: T.ter }}>Personal best: {longest} days</p>}
          <p className="m-0 mt-4 text-[17px] leading-relaxed max-w-xs" style={{ color: T.sec }}>
            {alreadyDone ? 'Already done today. Come back tomorrow and keep the fire burning.' : 'Ritual complete. You showed up. That is everything.'}
          </p>
          <p className="m-0 text-[15px]" style={{ color: T.ter }}>Keep showing up. Every day compounds.</p>
          <button onClick={() => go('/home')} className={`${primary} mt-8 max-w-sm`} style={primaryStyle}>Back to Today</button>
        </div>
      </Screen>
    )
  }

  const ITEMS = [
    { id: 'secret', icon: 'headphones' as IconName, label: 'The Strangest Secret', sub: 'Listen · Earl Nightingale · ~30 min' },
    { id: 'goals', icon: 'target' as IconName, label: 'Goal Card', sub: 'Read your quarterly goals out loud' },
    { id: 'affirmations', icon: 'mic' as IconName, label: 'Affirmations', sub: 'Your voice, your identity' },
    { id: 'write', icon: 'pen' as IconName, label: '20 Goals', sub: 'Write fresh · present tense' },
  ]
  const doneCount = completedSteps.filter((id) => ITEMS.some((it) => it.id === id)).length
  const allDone = doneCount === ITEMS.length
  const remaining = ITEMS.length - doneCount
  const pct = doneCount / ITEMS.length

  return (
    <Screen>
      <audio ref={audioRef} src={AUDIO_URL} preload="metadata" />
      {affirmationUrl && <audio ref={affAudioRef} src={affirmationUrl} />}

      <button onClick={() => go('/home')} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Today
      </button>

      {/* Hero */}
      <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.navy }}>
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={T.cyan} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${pct * 97.4} 97.4`} style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-base font-bold">{doneCount}/{ITEMS.length}</span>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>{dayName} · Morning ritual</p>
          <p className="m-0 mt-0.5 text-white text-[22px] leading-tight font-bold">{greeting}, {firstName}.</p>
          <p className="m-0 mt-1 text-[15px] text-white/70">
            {doneCount === 0 ? 'The world is quiet. This time is yours.' : allDone ? 'All done. Seal it below.' : `${remaining} to go · keep going.`}
          </p>
          {streakData?.current_streak > 0 && (
            <p className="m-0 mt-1.5 text-sm text-white/70 flex items-center gap-1.5"><span style={{ color: '#F59E0B' }}><Icon name="flame" size={16} /></span>{streakData.current_streak} day streak</p>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2.5">
        {ITEMS.map((item) => {
          const done = completedSteps.includes(item.id)
          const open = expanded === item.id
          return (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden transition-shadow" style={{ boxShadow: open ? '0 4px 20px rgba(15,23,42,0.08)' : 'none' }}>
              <button onClick={() => setExpanded(open ? null : item.id)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left min-h-[68px]" aria-expanded={open}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={done ? { background: '#DCFCE7', color: '#15803D' } : { background: '#E6F7F9', color: T.teal }}>
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[17px] font-semibold" style={{ color: done ? '#15803D' : T.ink }}>{item.label}</span>
                  <span className="block text-sm truncate" style={{ color: T.ter }}>{item.sub}</span>
                </span>
                {done ? (
                  <span className="gfm-pop w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#16A34A' }}>
                    <svg viewBox="0 0 12 12" width="13" height="13" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                ) : (
                  <span className="flex-shrink-0 transition-transform duration-200" style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none' }}>
                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>

              {open && (
                <div className="gfm-page px-4 pb-4 pt-3 border-t" style={{ borderColor: T.line }}>

                  {/* ── STRANGEST SECRET ── */}
                  {item.id === 'secret' && (
                    <div className="flex flex-col gap-4">
                      <p className="m-0 text-[15px] leading-relaxed" style={{ color: T.sec }}>Listen with your eyes closed. Let every word land before the day begins.</p>
                      <div className="rounded-2xl p-5" style={{ background: T.navy }}>
                        <div className="flex items-center justify-center gap-[3px] h-9 mb-4" aria-hidden="true">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} className="w-1 rounded-full" style={{ height: isPlaying ? `${8 + ((i * 7) % 11) * 2.4}px` : '4px', background: isPlaying ? T.cyan : 'rgba(255,255,255,0.18)', transition: 'height 0.3s ease' }} />
                          ))}
                        </div>
                        <div className="flex justify-between text-sm text-white/60 mb-2">
                          <span>{formatTime(audioTime)}</span>
                          <span>{audioDuration ? formatTime(audioDuration) : '30:00'}</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ background: T.cyan, width: `${audioDuration ? (audioTime / audioDuration) * 100 : 0}%` }} />
                        </div>
                        <div className="flex items-center justify-center gap-6">
                          <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30) }} className="text-white/70 text-[15px] min-h-11 min-w-11">−30s</button>
                          <button onClick={toggleAudio} aria-label={isPlaying ? 'Pause' : 'Play'} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: T.cyan }}>
                            {isPlaying
                              ? <svg viewBox="0 0 24 24" width="22" height="22" fill={T.navy}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                              : <svg viewBox="0 0 24 24" width="22" height="22" fill={T.navy}><polygon points="8,5 19,12 8,19" /></svg>}
                          </button>
                          <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 30) }} className="text-white/70 text-[15px] min-h-11 min-w-11">+30s</button>
                        </div>
                      </div>
                      <p className="m-0 text-sm text-center" style={{ color: listenedEnough ? '#15803D' : T.ter }}>
                        {listenedEnough ? '✓ Ready to mark complete' : 'Listen for at least 5 minutes to mark complete'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => markDone('secret')} disabled={!listenedEnough} className={primary} style={primaryStyle}>Mark complete</button>
                        <button onClick={() => markDone('secret')} className={secondary} style={secondaryStyle}>Skip</button>
                      </div>
                    </div>
                  )}

                  {/* ── GOAL CARD ── */}
                  {item.id === 'goals' && (
                    <div className="flex flex-col gap-3">
                      <p className="m-0 text-[15px] leading-relaxed" style={{ color: T.sec }}>Read these out loud. Slowly. With full conviction they are already done.</p>
                      {goalCard ? (
                        [
                          { label: 'Goal one', text: goalCard.goal1_text, deadline: goalCard.goal1_deadline },
                          { label: 'Goal two', text: goalCard.goal2_text, deadline: goalCard.goal2_deadline },
                        ].map((g, i) => (
                          <div key={i} className="rounded-2xl p-4" style={{ background: '#F8FAFC', border: `1px solid ${T.line}` }}>
                            <p className="m-0 mb-1.5 text-xs font-bold tracking-[0.1em] uppercase" style={{ color: T.teal }}>{g.label}</p>
                            <p className="m-0 text-[17px] leading-relaxed font-medium">{g.text}</p>
                            {g.deadline && <p className="m-0 mt-2 text-sm" style={{ color: T.ter }}>By {g.deadline}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl p-5 text-center" style={{ background: '#F8FAFC', border: `1px dashed ${T.line}` }}>
                          <p className="m-0 mb-2 text-[15px]" style={{ color: T.sec }}>No goal card yet.</p>
                          <button onClick={() => go('/ritual/goal-card')} className="text-[15px] font-semibold" style={{ color: T.teal }}>Set up my goal card →</button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => markDone('goals')} className={primary} style={primaryStyle}>I’ve read it</button>
                        <button onClick={() => go('/ritual/goal-card')} className={secondary} style={secondaryStyle}>Edit</button>
                      </div>
                    </div>
                  )}

                  {/* ── AFFIRMATIONS ── */}
                  {item.id === 'affirmations' && (
                    <div className="flex flex-col gap-3">
                      <p className="m-0 text-[15px] leading-relaxed" style={{ color: T.sec }}>Your own voice is the most powerful signal your mind receives. Hear yourself say who you are becoming.</p>

                      {!affirmationText && !generatingAff && (
                        <button onClick={generateAffirmations} className="w-full min-h-[50px] rounded-2xl text-[15px] font-semibold" style={{ background: '#E6F7F9', color: T.teal }}>Write my affirmations →</button>
                      )}
                      {generatingAff && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-5 h-5 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: T.line, borderTopColor: T.teal }} />
                          <p className="m-0 text-[15px]" style={{ color: T.sec }}>Writing your affirmations…</p>
                        </div>
                      )}

                      {affirmationText && (
                        <>
                          <div className="rounded-2xl p-4 max-h-40 overflow-y-auto" style={{ background: '#F8FAFC', border: `1px solid ${T.line}` }}>
                            <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: T.sec }}>{affirmationText.split('\n').slice(0, 10).join('\n')}…</p>
                          </div>

                          {affirmationUrl && (
                            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: T.navy }}>
                              <button
                                onClick={() => {
                                  const audio = affAudioRef.current
                                  if (!audio) return
                                  if (affPlaying) { audio.pause(); setAffPlaying(false) }
                                  else { audio.play(); setAffPlaying(true); audio.onended = () => setAffPlaying(false) }
                                }}
                                aria-label={affPlaying ? 'Pause' : 'Play'}
                                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.cyan }}
                              >
                                {affPlaying
                                  ? <svg viewBox="0 0 24 24" width="16" height="16" fill={T.navy}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                                  : <svg viewBox="0 0 24 24" width="16" height="16" fill={T.navy}><polygon points="8,5 19,12 8,19" /></svg>}
                              </button>
                              <div>
                                <p className="m-0 text-white text-[15px] font-semibold">Your affirmation recording</p>
                                <p className="m-0 text-white/60 text-sm">{affPlaying ? 'Playing…' : 'Tap to listen'}</p>
                              </div>
                            </div>
                          )}

                          {!recording && !uploadingRec && (
                            <button onClick={startRecording} className="w-full min-h-[50px] rounded-2xl text-[15px] font-medium flex items-center justify-center gap-2" style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.ink }}>
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                              {affirmationUrl ? 'Re-record' : 'Record my affirmations'}
                            </button>
                          )}
                          {recording && (
                            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[15px] font-semibold text-red-600">Recording {formatTime(recordingTime)}</span>
                              </div>
                              <button onClick={stopRecording} className="bg-red-500 text-white px-5 min-h-11 rounded-xl text-[15px] font-semibold">Stop</button>
                            </div>
                          )}
                          {uploadingRec && (
                            <div className="flex items-center gap-2 py-2">
                              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: T.line, borderTopColor: T.teal }} />
                              <p className="m-0 text-[15px]" style={{ color: T.sec }}>Saving recording…</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => markDone('affirmations')} className={primary} style={primaryStyle}>{affirmationUrl ? 'I’ve listened' : 'Mark complete'}</button>
                        <button onClick={() => markDone('affirmations')} className={secondary} style={secondaryStyle}>Skip</button>
                      </div>
                    </div>
                  )}

                  {/* ── 20 GOALS ── */}
                  {item.id === 'write' && (
                    <div className="flex flex-col gap-3">
                      <p className="m-0 text-[15px] leading-relaxed" style={{ color: T.sec }}>Don’t look at yesterday’s list. Write fresh, in the present tense — as if already achieved.</p>
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: '#EEF2F6' }} role="tablist">
                        {[1, 2].map((pg) => (
                          <button key={pg} role="tab" aria-selected={goalsPage === pg} onClick={() => setGoalsPage(pg)}
                            className="py-2 rounded-lg text-sm font-semibold transition-all"
                            style={goalsPage === pg ? { background: '#fff', color: T.ink, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: T.ter }}>
                            Goals {pg === 1 ? '1–10' : '11–20'}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const idx = goalsPage === 1 ? i : i + 10
                          return (
                            <label key={idx} className="flex items-center gap-2.5">
                              <span className="text-sm font-bold w-6 text-right flex-shrink-0" style={{ color: T.teal }}>{idx + 1}</span>
                              <input
                                type="text"
                                value={goals[idx]}
                                onChange={(e) => { const u = [...goals]; u[idx] = e.target.value; setGoals(u) }}
                                placeholder="I am…"
                                className="flex-1 min-h-11 rounded-xl px-3.5 text-base focus:outline-none"
                                style={{ background: '#F8FAFC', border: `1px solid ${T.line}` }}
                              />
                            </label>
                          )
                        })}
                      </div>
                      <button onClick={saveGoals} disabled={savingGoals} className={primary} style={primaryStyle}>{savingGoals ? 'Saving…' : 'Save & complete'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Seal the ritual */}
      <div className="mt-2 flex flex-col gap-2">
        {allDone ? (
          <button onClick={completeRitual} disabled={finishing} className="w-full min-h-[56px] rounded-2xl text-[17px] font-bold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: T.cyan, color: T.navy }}>
            {finishing ? 'Completing…' : <><Icon name="flame" size={20} />Complete my ritual</>}
          </button>
        ) : (
          <>
            <p className="m-0 text-center text-sm" style={{ color: T.ter }}>{remaining} step{remaining !== 1 ? 's' : ''} remaining</p>
            <button onClick={completeRitual} disabled={finishing} className="w-full min-h-[52px] rounded-2xl text-base font-medium disabled:opacity-50" style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.sec }}>
              {finishing ? 'Completing…' : 'Complete ritual anyway'}
            </button>
          </>
        )}
      </div>
    </Screen>
  )
}
