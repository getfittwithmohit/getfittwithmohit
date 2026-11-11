'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import {
  finishLog,
  getActivePlan,
  getExerciseHistory,
  getIdentityStatement,
  getLogs,
  reportPain,
  saveSet,
  setFeel,
  startOrResumeLog,
  type ExerciseHistory,
} from '@/lib/supabase/queries/workouts'
import {
  formatKg,
  formatSeconds,
  isPersonalBest,
  setScore,
  targetFor,
  todaysSession,
  totalVolume,
} from '@/lib/utils/workouts'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { istDate } from '@/lib/utils/istDate'
import { beep, keepScreenAwake, unlockAudio } from '@/lib/utils/workoutDevice'
import type { Feel, PlanExercise, PlanSession, WorkoutLog, WorkoutPlan, WorkoutSet } from '@/lib/types/workouts'

const CYAN = '#00D4E8'
const GOLD = '#F5B83D'

type Phase = 'identity' | 'exercise' | 'rest' | 'summary'

type Draft = { weight: number | null; reps: number | null; seconds: number | null; distance: number | null; minutes: number | null }

const setKey = (exerciseId: string, n: number) => `${exerciseId}:${n}`

export default function WorkoutPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [session, setSession] = useState<PlanSession | null>(null)
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [previousLogs, setPreviousLogs] = useState<WorkoutLog[]>([])
  const [history, setHistory] = useState<ExerciseHistory>({ best: {}, last: {} })
  const [identity, setIdentity] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, WorkoutSet>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [phase, setPhase] = useState<Phase>('identity')
  const [exIndex, setExIndex] = useState(0)
  // Editor values belong to one set ("exerciseId:setNumber"). A new set
  // starts from fresh defaults without an effect resetting state.
  const [draftState, setDraftState] = useState<{ key: string; values: Draft } | null>(null)
  const [savingSet, setSavingSet] = useState(false)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [prBanner, setPrBanner] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoFor, setVideoFor] = useState<string | null>(null)
  const [painOpen, setPainOpen] = useState(false)
  const [painNote, setPainNote] = useState('')
  const [painSent, setPainSent] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [timer, setTimer] = useState<{ key: string; start: number } | null>(null)
  const [feel, setFeelState] = useState<Feel | null>(null)
  const [finishing, setFinishing] = useState(false)

  const targetBeeped = useRef<string | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (clientLoading) return
    let cancelled = false
    async function load() {
      if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
      const [activePlan, logs, statement] = await Promise.all([
        getActivePlan(client.id),
        getLogs(client.id, 60),
        getIdentityStatement(client.id),
      ])
      if (!activePlan) throw new Error('Coach Mohit hasn’t set up your workout plan yet.')

      // A specific session can be chosen (e.g. "train anyway" on a rest day)
      const requested = new URLSearchParams(window.location.search).get('session')
      let chosen = activePlan.plan_sessions.find((s) => s.id === requested) || null
      if (!chosen) {
        const state = todaysSession(activePlan, logs, istDate(), (l) => istDate(new Date(l.completed_at || l.started_at)))
        chosen = state.kind === 'ready' ? state.session : state.kind === 'done_today' || state.kind === 'rest_day' ? state.next : null
      }
      if (!chosen || !chosen.plan_exercises.length) throw new Error('This session has no exercises yet — your coach is still building it.')

      const exercises = chosen.plan_exercises.map((pe) => pe.exercise!).filter(Boolean)
      const [{ log: started, sets }, hist] = await Promise.all([
        startOrResumeLog(client.id, activePlan.id, chosen),
        getExerciseHistory(client.id, exercises),
      ])
      if (cancelled) return

      const savedMap: Record<string, WorkoutSet> = {}
      for (const s of sets) savedMap[setKey(s.exercise_id, s.set_number)] = s

      // Resume at the first exercise that still has sets to do
      const firstOpen = chosen.plan_exercises.findIndex(
        (pe) => sets.filter((s) => s.exercise_id === pe.exercise_id).length < pe.sets
      )

      setPlan(activePlan)
      setSession(chosen)
      setLog(started)
      setPreviousLogs(logs.filter((l) => l.status === 'completed'))
      setHistory(hist)
      setIdentity(statement)
      setSaved(savedMap)
      setExIndex(firstOpen === -1 ? chosen.plan_exercises.length - 1 : firstOpen)
      setPhase(sets.length > 0 || !statement ? 'exercise' : 'identity')
    }
    load()
      .catch((err: Error) => { if (!cancelled) setLoadError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [client, clientLoading])

  // Keep the screen on while training; tick a clock for timers
  useEffect(() => {
    if (!log || phase === 'summary') return
    const release = keepScreenAwake()
    const tick = setInterval(() => setNow(Date.now()), 250)
    return () => {
      release()
      clearInterval(tick)
    }
  }, [log, phase])

  // Identity moment: 3 seconds, then straight into exercise 1
  useEffect(() => {
    if (phase !== 'identity') return
    const t = setTimeout(() => setPhase('exercise'), 3200)
    return () => clearTimeout(t)
  }, [phase])

  const pe: PlanExercise | null = session?.plan_exercises[exIndex] || null
  const exercise = pe?.exercise || null
  const doneSetsFor = useCallback(
    (p: PlanExercise) => Object.values(saved).filter((s) => s.exercise_id === p.exercise_id).sort((a, b) => a.set_number - b.set_number),
    [saved]
  )
  const doneSets = pe ? doneSetsFor(pe) : []
  const currentSetNumber = doneSets.length + 1

  const target = useMemo(() => {
    if (!pe || !exercise || !plan) return null
    const last = history.last[exercise.id]
    return targetFor(pe, exercise, last?.sets || [], last?.feel || null, plan.progression_enabled)
  }, [pe, exercise, plan, history])

  // What the editor shows for the current set: the client's edits if any,
  // else the set they just did, else today's target
  const currentKey = pe ? setKey(pe.exercise_id, currentSetNumber) : ''
  const defaults: Draft = useMemo(() => {
    const prev = doneSets[doneSets.length - 1]
    return {
      weight: prev?.weight_kg ?? target?.weight_kg ?? null,
      reps: prev?.reps ?? target?.reps ?? null,
      seconds: prev?.seconds ?? target?.seconds ?? null,
      distance: prev?.distance_km ?? target?.distance_km ?? null,
      minutes: target?.seconds ? Math.round(target.seconds / 60) : null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, target])
  const draft: Draft = draftState?.key === currentKey ? draftState.values : defaults
  const setDraft = (update: (d: Draft) => Draft) => setDraftState({ key: currentKey, values: update(draft) })
  const timerStart = timer?.key === currentKey ? timer.start : null
  const videoOpen = videoFor === currentKey

  // Rest countdown
  useEffect(() => {
    if (phase !== 'rest' || restLeft <= 0) return
    const t = setTimeout(() => {
      if (restLeft <= 1) {
        beep(2)
        setRestLeft(0)
        setPhase('exercise')
      } else {
        setRestLeft(restLeft - 1)
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [phase, restLeft])

  // Timed holds: beep when the target is reached
  const timerElapsed = timerStart ? Math.floor((now - timerStart) / 1000) : 0
  useEffect(() => {
    if (!timerStart || !pe?.target_seconds || targetBeeped.current === currentKey) return
    if (timerElapsed >= pe.target_seconds) {
      targetBeeped.current = currentKey
      beep(2, 1040)
    }
  }, [timerElapsed, timerStart, pe?.target_seconds, currentKey])

  if (checking || clientLoading || loading) return <PageLoader />

  if (loadError || !session || !log || !plan) {
    return (
      <Dark>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
          <p className="text-lg font-semibold">{loadError || 'Something went wrong loading your workout.'}</p>
          <a href="/home" className="h-12 px-6 rounded-2xl flex items-center font-semibold" style={{ background: CYAN, color: '#0a0f1a' }}>Back home</a>
        </div>
      </Dark>
    )
  }

  const allSets = Object.values(saved)
  const exercisesDone = session.plan_exercises.filter((p) => doneSetsFor(p).length >= p.sets).length
  const elapsed = Math.max(0, Math.floor((now - Date.parse(log.started_at)) / 1000))

  // ── Actions ─────────────────────────────────────────────────────────────

  const completeSet = async () => {
    if (!pe || !exercise || !client) return
    unlockAudio()
    const lt = exercise.log_type
    const seconds = lt === 'time' ? (timerStart ? timerElapsed : draft.seconds) : lt === 'time_distance' ? (draft.minutes ?? 0) * 60 : null
    const values = {
      weight_kg: lt === 'weight_reps' ? draft.weight ?? 0 : null,
      reps: lt === 'weight_reps' || lt === 'reps' ? draft.reps ?? 0 : null,
      seconds,
      distance_km: lt === 'time_distance' ? draft.distance : null,
    }
    if ((lt === 'weight_reps' || lt === 'reps') && !values.reps) return setError('How many reps did you do?')
    if (lt === 'time' && !values.seconds) return setError('Start the timer, or set the time with + and −.')
    if (lt === 'time_distance' && !values.seconds && !values.distance_km) return setError('Add your time or distance.')

    const previousBest = history.best[exercise.id] ?? null
    const pr = isPersonalBest(lt, previousBest, values)

    setSavingSet(true)
    setError(null)
    try {
      const row = await saveSet({
        log_id: log.id,
        client_id: client.id,
        exercise_id: exercise.id,
        plan_exercise_id: pe.id,
        set_number: currentSetNumber,
        ...values,
        is_pr: pr,
      })
      setSaved((s) => ({ ...s, [setKey(exercise.id, row.set_number)]: row }))
      if (pr) {
        setHistory((h) => ({ ...h, best: { ...h.best, [exercise.id]: setScore(lt, values) } }))
        setPrBanner(
          lt === 'weight_reps' ? `${formatKg(values.weight_kg || 0)} kg × ${values.reps} on ${exercise.name}`
            : lt === 'reps' ? `${values.reps} reps on ${exercise.name}`
            : lt === 'time' ? `${formatSeconds(values.seconds || 0)} on ${exercise.name}`
            : `${values.distance_km} km on ${exercise.name}`
        )
      } else {
        setPrBanner(null)
      }

      const finishedThisExercise = currentSetNumber >= pe.sets
      const isLastExercise = session.plan_exercises.slice(exIndex + 1).every((p) => doneSetsFor(p).length >= p.sets)
      if (finishedThisExercise && isLastExercise) {
        await finish({ ...saved, [setKey(exercise.id, row.set_number)]: row })
        return
      }
      if (finishedThisExercise) {
        const nextIndex = session.plan_exercises.findIndex((p, i) => i > exIndex && doneSetsFor(p).length < p.sets)
        setExIndex(nextIndex === -1 ? exIndex : nextIndex)
      }
      if (pe.rest_seconds > 0) {
        setRestTotal(pe.rest_seconds)
        setRestLeft(pe.rest_seconds)
        setPhase('rest')
      }
    } catch (err) {
      setError((err as Error).message + ' — check your signal and tap again.')
    } finally {
      setSavingSet(false)
    }
  }

  const finish = async (finalSets: Record<string, WorkoutSet> = saved) => {
    setFinishing(true)
    setError(null)
    try {
      const sets = Object.values(finalSets)
      await finishLog(log.id, (Date.now() - Date.parse(log.started_at)) / 1000, totalVolume(sets))
      setLog({ ...log, status: 'completed', completed_at: new Date().toISOString(), total_volume_kg: totalVolume(sets) })
      setPhase('summary')
      beep(1, 660)
    } catch (err) {
      setError((err as Error).message + ' — tap Finish again.')
    } finally {
      setFinishing(false)
    }
  }

  const sendPain = async () => {
    if (!exercise || !client) return
    try {
      const res = await reportPain(client.id, log.id, exercise.id, painNote)
      setPainSent(res.coachNotified ? 'Coach Mohit has been alerted. Skip this exercise for today.' : 'Saved — but the alert didn’t send. Message Coach Mohit on WhatsApp too.')
      setPainNote('')
    } catch (err) {
      setPainSent((err as Error).message)
    }
  }

  const skipExercise = () => {
    setMenuOpen(false)
    const nextIndex = session.plan_exercises.findIndex((p, i) => i > exIndex && doneSetsFor(p).length < p.sets)
    if (nextIndex !== -1) setExIndex(nextIndex)
  }

  // ── Screens ─────────────────────────────────────────────────────────────

  if (phase === 'identity') {
    return (
      <Dark>
        <button onClick={() => { unlockAudio(); setPhase('exercise') }} className="flex-1 flex flex-col px-8 text-left" style={{ background: 'radial-gradient(120% 80% at 50% 30%, #1a1f3a 0%, #0a0f1a 70%)' }}>
          <span className="flex-1" />
          <span className="flex flex-col gap-5">
            <span className="block w-11 h-[3px] rounded" style={{ background: CYAN }} />
            <span className="text-xs tracking-[0.16em] uppercase text-[#94a3b8] font-semibold">Who you are becoming</span>
            <span className="text-[32px] leading-tight font-semibold" style={{ fontFamily: 'var(--font-display, inherit)' }}>“{identity}”</span>
            <span className="text-[15px] text-[#94a3b8]">Every rep today is a vote for this.</span>
          </span>
          <span className="flex-1" />
          <span className="pb-10 text-center text-sm text-[#94a3b8]">Starting {session.plan_exercises[exIndex]?.exercise?.name}… tap to skip</span>
        </button>
      </Dark>
    )
  }

  if (phase === 'summary') {
    const prs = allSets.filter((s) => s.is_pr)
    const volume = totalVolume(allSets)
    const previousSame = previousLogs.find((l) => l.session_id === session.id && l.id !== log.id && l.total_volume_kg)
    const change = previousSame?.total_volume_kg ? Math.round(((volume - previousSame.total_volume_kg) / previousSame.total_volume_kg) * 100) : null
    const xp = 20 + Math.min(2, prs.length) * 15
    const nameOf = (id: string) => session.plan_exercises.find((p) => p.exercise_id === id)?.exercise?.name || 'Exercise'
    return (
      <Dark>
        <div className="flex-1 flex flex-col px-4 pt-9 pb-6 gap-3 overflow-y-auto">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: 'rgba(0,212,232,0.14)', border: `2px solid ${CYAN}` }}>
              <Check color={CYAN} size={34} />
            </div>
            <h1 className="text-[30px] font-bold">Session complete</h1>
            <p className="text-sm text-[#cbd5e1]">Promise kept{client?.full_name ? `, ${client.full_name.split(' ')[0]}` : ''}.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat value={formatSeconds(log.duration_seconds || elapsed)} label="duration" />
            <Stat value={volume ? Math.round(volume).toLocaleString('en-IN') : '—'} label="kg lifted" />
            <Stat value={change === null ? '—' : `${change >= 0 ? '+' : ''}${change}%`} label="vs last time" color={change !== null && change >= 0 ? '#22c55e' : undefined} />
          </div>

          {prs.length > 0 && (
            <div className="rounded-[18px] bg-[#121626] px-[18px] py-4 flex flex-col gap-3" style={{ border: '1px solid rgba(245,184,61,0.35)' }}>
              <p className="text-[11px] tracking-[0.14em] uppercase font-semibold" style={{ color: GOLD }}>{prs.length} personal best{prs.length === 1 ? '' : 's'}</p>
              {prs.map((s) => (
                <div key={s.id} className="flex justify-between text-[15px]">
                  <span>{nameOf(s.exercise_id)}</span>
                  <span className="font-semibold">
                    {s.weight_kg !== null ? `${formatKg(s.weight_kg)} kg × ${s.reps}` : s.reps !== null ? `${s.reps} reps` : s.seconds !== null && s.distance_km === null ? formatSeconds(s.seconds) : `${s.distance_km} km`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-[18px] px-[18px] py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #1a1f3a, #121732)', border: '1px solid rgba(0,212,232,0.25)' }}>
            <span className="text-[15px] font-semibold">XP earned</span>
            <span className="text-[26px] font-bold" style={{ color: CYAN }}>+{xp}</span>
          </div>

          <div className="rounded-[18px] bg-[#121626] px-[18px] py-3.5 flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline">
              <p className="text-sm font-semibold">How did that feel?</p>
              <p className="text-[11px] text-[#94a3b8]">Shapes your next session</p>
            </div>
            <div className="flex gap-2">
              {([
                { v: 'easy', l: 'Easy' },
                { v: 'right', l: 'Just right' },
                { v: 'brutal', l: 'Brutal' },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  onClick={() => { setFeelState(o.v); setFeel(log.id, o.v).catch((err: Error) => setError(err.message)) }}
                  className="flex-1 h-11 rounded-xl text-[13px]"
                  style={feel === o.v ? { border: `1px solid ${CYAN}`, background: 'rgba(0,212,232,0.12)', color: '#fff', fontWeight: 600 } : { border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[13px] text-[#cbd5e1] px-1 flex items-center gap-2">
            <Check color="#22c55e" size={16} /> “Workout done” will be pre-ticked in today’s check-in
          </p>
          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex-1" />
          <a href="/home" className="h-[58px] rounded-[18px] flex items-center justify-center text-[17px] font-bold" style={{ background: CYAN, color: '#0a0f1a' }}>Done</a>
        </div>
      </Dark>
    )
  }

  if (phase === 'rest') {
    const progress = restTotal ? restLeft / restTotal : 0
    const circumference = 2 * Math.PI * 108
    const nextPe = session.plan_exercises[exIndex]
    const nextDone = nextPe ? doneSetsFor(nextPe).length : 0
    return (
      <Dark>
        <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-6">
          {prBanner && (
            <div className="self-stretch rounded-[20px] px-[18px] py-4 flex items-center gap-3.5" style={{ background: 'linear-gradient(135deg, rgba(245,184,61,0.20), rgba(245,184,61,0.04))', border: '1px solid rgba(245,184,61,0.5)' }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: GOLD }}><Trophy /></div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-[11px] tracking-[0.14em] uppercase font-bold" style={{ color: GOLD }}>New personal best</p>
                <p className="text-lg font-bold leading-snug">{prBanner}</p>
                <p className="text-xs text-[#cbd5e1]">+15 XP</p>
              </div>
            </div>
          )}

          <p className="mt-12 text-[13px] tracking-[0.14em] uppercase text-[#94a3b8]">Rest</p>
          <div className="mt-4 w-60 h-60 relative flex items-center justify-center">
            <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true" className="absolute inset-0">
              <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
              <circle cx="120" cy="120" r="108" fill="none" stroke={CYAN} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} transform="rotate(-90 120 120)" />
            </svg>
            <div className="flex flex-col items-center">
              <p className="text-[64px] font-bold leading-none tabular-nums" aria-live="polite">{formatSeconds(restLeft)}</p>
              <p className="text-[13px] text-[#94a3b8]">of {formatSeconds(restTotal)}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => { const next = Math.max(0, restLeft - 15); setRestLeft(next); if (next === 0) setPhase('exercise') }} className="w-24 h-11 rounded-xl border border-white/15 text-sm font-semibold">−15 s</button>
            <button onClick={() => { setRestLeft((s) => s + 15); setRestTotal((t) => t + 15) }} className="w-24 h-11 rounded-xl border border-white/15 text-sm font-semibold">+15 s</button>
          </div>
          {nextPe && (
            <div className="mt-9 self-stretch rounded-[18px] bg-[#121626] px-[18px] py-4">
              <p className="text-xs text-[#94a3b8]">Up next</p>
              <p className="text-base font-semibold">{nextPe.exercise?.name} · set {Math.min(nextDone + 1, nextPe.sets)} of {nextPe.sets}</p>
            </div>
          )}
          <div className="flex-1" />
          <button onClick={() => setPhase('exercise')} className="self-stretch h-[58px] rounded-[18px] font-bold" style={{ border: `1px solid ${CYAN}`, color: CYAN }}>Skip rest</button>
        </div>
      </Dark>
    )
  }

  // ── Exercise (focus mode) ───────────────────────────────────────────────
  if (!pe || !exercise || !target) return <PageLoader />
  const lt = exercise.log_type
  const embed = getVideoEmbedUrl(exercise.video_url)
  const step = exercise.weight_step || 2.5

  return (
    <Dark>
      <div className="flex-1 flex flex-col pb-5 overflow-y-auto">
        <div className="px-5 pt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <a href="/home" aria-label="Leave workout (progress is saved)" className="w-11 h-11 rounded-xl bg-[#121626] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </a>
            <p className="text-[13px] text-[#94a3b8] tabular-nums">Exercise {exIndex + 1} of {session.plan_exercises.length} · {formatSeconds(elapsed)}</p>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="More: session list, skip, finish" className="w-11 h-11 rounded-xl bg-[#121626] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#cbd5e1" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
            </button>
          </div>
          <div className="h-1 rounded bg-white/10 overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${(exercisesDone / session.plan_exercises.length) * 100}%`, background: CYAN }} />
          </div>
        </div>

        {menuOpen && (
          <div className="mx-4 mt-3 rounded-2xl bg-[#121626] border border-white/10 overflow-hidden">
            {session.plan_exercises.map((p, i) => {
              const n = doneSetsFor(p).length
              return (
                <button key={p.id} onClick={() => { setExIndex(i); setMenuOpen(false) }} className={`w-full flex justify-between px-4 py-3 text-sm border-b border-white/5 ${i === exIndex ? 'text-white font-semibold' : 'text-[#cbd5e1]'}`}>
                  <span>{i + 1}. {p.exercise?.name}</span>
                  <span className={n >= p.sets ? 'text-[#22c55e]' : 'text-[#94a3b8]'}>{n >= p.sets ? 'Done' : `${n}/${p.sets}`}</span>
                </button>
              )
            })}
            <div className="flex">
              <button onClick={skipExercise} className="flex-1 h-12 text-sm text-[#cbd5e1] border-r border-white/5">Skip this exercise</button>
              <button onClick={() => { setMenuOpen(false); if (window.confirm('Finish now? Sets you’ve done are saved.')) finish() }} disabled={finishing || !allSets.length} className="flex-1 h-12 text-sm disabled:opacity-40" style={{ color: CYAN }}>Finish workout</button>
            </div>
          </div>
        )}

        {/* Demo video */}
        <div className="mx-4 mt-4 rounded-[20px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f3a, #0f1428)' }}>
          {videoOpen && embed ? (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`} title={`${exercise.name} demo`} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            </div>
          ) : (
            <button onClick={() => embed && setVideoFor(currentKey)} disabled={!embed} className="w-full h-[150px] flex flex-col items-center justify-center gap-2" aria-label="Play demo video">
              {embed ? (
                <span className="w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: 'rgba(0,212,232,0.9)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a0f1a" aria-hidden="true"><polygon points="8,5 19,12 8,19" /></svg>
                </span>
              ) : (
                <span className="text-sm text-[#94a3b8]">Demo video coming soon</span>
              )}
            </button>
          )}
        </div>

        <div className="mx-[22px] mt-4 flex flex-col gap-2">
          <h1 className="text-[26px] font-bold leading-tight">{exercise.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            {exercise.cues.map((c) => <span key={c} className="text-xs text-[#cbd5e1] bg-[#121626] px-2.5 py-1.5 rounded-full">{c}</span>)}
          </div>
          {pe.note && <p className="text-sm" style={{ color: CYAN }}>Coach: {pe.note}</p>}
        </div>

        {/* Sets */}
        <div className="mx-4 mt-4 flex flex-col gap-2">
          {doneSets.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-3.5 py-3 rounded-[14px]" style={{ background: s.is_pr ? 'rgba(245,184,61,0.10)' : 'rgba(34,197,94,0.08)' }}>
              <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ background: s.is_pr ? GOLD : '#22c55e' }}><Check color="#0a0f1a" size={14} /></span>
              <span className="flex-1 text-[15px] text-[#e2e8f0]">Set {s.set_number}{s.is_pr ? ' · PB' : ''}</span>
              <span className="text-[15px] font-semibold tabular-nums">{describeSet(lt, s)}</span>
            </div>
          ))}

          {currentSetNumber <= pe.sets && (
            <div className="p-4 rounded-[18px] bg-[#121626] flex flex-col gap-3.5" style={{ border: `1px solid ${CYAN}` }}>
              <div className="flex justify-between items-center">
                <p className="text-[15px] font-semibold">Set {currentSetNumber} of {pe.sets}</p>
                {target.lastTimeLabel && <p className="text-xs text-[#94a3b8]">{target.lastTimeLabel}</p>}
              </div>

              {lt === 'weight_reps' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Stepper label="Weight (kg)" value={draft.weight} display={draft.weight === null ? '–' : formatKg(draft.weight)}
                    onMinus={() => setDraft((d) => ({ ...d, weight: Math.max(0, (d.weight ?? 0) - step) }))}
                    onPlus={() => setDraft((d) => ({ ...d, weight: (d.weight ?? 0) + step }))} />
                  <Stepper label="Reps" value={draft.reps} display={draft.reps === null ? '–' : String(draft.reps)}
                    onMinus={() => setDraft((d) => ({ ...d, reps: Math.max(0, (d.reps ?? 0) - 1) }))}
                    onPlus={() => setDraft((d) => ({ ...d, reps: (d.reps ?? 0) + 1 }))} />
                </div>
              )}
              {lt === 'reps' && (
                <Stepper label="Reps" value={draft.reps} display={draft.reps === null ? '–' : String(draft.reps)}
                  onMinus={() => setDraft((d) => ({ ...d, reps: Math.max(0, (d.reps ?? 0) - 1) }))}
                  onPlus={() => setDraft((d) => ({ ...d, reps: (d.reps ?? 0) + 1 }))} />
              )}
              {lt === 'time' && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[52px] font-bold leading-none tabular-nums">{formatSeconds(timerStart ? timerElapsed : draft.seconds ?? 0)}</p>
                  {pe.target_seconds ? <p className="text-xs text-[#94a3b8]">Target {formatSeconds(pe.target_seconds)} · beeps when you hit it</p> : null}
                  {!timerStart ? (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setDraft((d) => ({ ...d, seconds: Math.max(0, (d.seconds ?? 0) - 5) }))} className="w-12 h-12 rounded-xl bg-white/5 text-xl">−</button>
                      <button onClick={() => { unlockAudio(); setTimer({ key: currentKey, start: Date.now() }) }} className="flex-1 h-12 rounded-xl font-bold" style={{ background: 'rgba(0,212,232,0.15)', color: CYAN }}>Start timer</button>
                      <button onClick={() => setDraft((d) => ({ ...d, seconds: (d.seconds ?? 0) + 5 }))} className="w-12 h-12 rounded-xl bg-white/5 text-xl">+</button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94a3b8]">Tap “Set done” to stop and log</p>
                  )}
                </div>
              )}
              {lt === 'time_distance' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <NumberField label="Minutes" value={draft.minutes} step={1} onChange={(v) => setDraft((d) => ({ ...d, minutes: v }))} />
                  <NumberField label="Distance (km)" value={draft.distance} step={0.1} onChange={(v) => setDraft((d) => ({ ...d, distance: v }))} />
                </div>
              )}
              {target.progressed && currentSetNumber === 1 && (
                <p className="text-center text-xs" style={{ color: CYAN }}>+{formatKg(step)} kg on last time — you earned it</p>
              )}
            </div>
          )}

          {Array.from({ length: Math.max(0, pe.sets - currentSetNumber) }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-[#0f1322]">
              <span className="w-[26px] h-[26px] rounded-full border-[1.5px] border-[#334155]" />
              <span className="flex-1 text-[15px] text-[#94a3b8]">Set {currentSetNumber + i + 1}</span>
            </div>
          ))}
        </div>

        {error && <p className="mx-4 mt-3 text-sm text-red-300">{error}</p>}

        {painOpen && (
          <div className="mx-4 mt-3 rounded-2xl bg-[#121626] border border-red-400/30 p-4 flex flex-col gap-3">
            {painSent ? (
              <>
                <p className="text-sm text-[#e2e8f0]">{painSent}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPainOpen(false); setPainSent(null); skipExercise() }} className="flex-1 h-11 rounded-xl text-sm font-semibold" style={{ background: CYAN, color: '#0a0f1a' }}>Skip to next exercise</button>
                  <button onClick={() => { setPainOpen(false); setPainSent(null) }} className="h-11 px-4 rounded-xl text-sm text-[#cbd5e1] border border-white/10">Close</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Where does it hurt, and how?</p>
                <textarea value={painNote} onChange={(e) => setPainNote(e.target.value)} rows={3} placeholder="e.g. Sharp pain in my right shoulder at the bottom of the press"
                  className="w-full rounded-xl bg-[#0a0f1a] border border-white/10 p-3 text-sm text-white placeholder:text-[#64748b]" />
                <div className="flex gap-2">
                  <button onClick={sendPain} className="flex-1 h-11 rounded-xl text-sm font-semibold bg-red-500 text-white">Tell Coach Mohit</button>
                  <button onClick={() => setPainOpen(false)} className="h-11 px-4 rounded-xl text-sm text-[#cbd5e1] border border-white/10">Cancel</button>
                </div>
                <p className="text-xs text-[#94a3b8]">Sharp pain means stop this exercise. Don’t push through it.</p>
              </>
            )}
          </div>
        )}

        <div className="flex-1 min-h-6" />
        <div className="px-4 flex flex-col gap-2.5">
          {currentSetNumber <= pe.sets ? (
            <button onClick={completeSet} disabled={savingSet} className="h-[62px] rounded-[18px] flex items-center justify-center gap-2.5 text-lg font-bold disabled:opacity-60" style={{ background: CYAN, color: '#0a0f1a' }}>
              <Check color="#0a0f1a" size={20} /> {savingSet ? 'Saving…' : 'Set done'}
            </button>
          ) : (
            <button onClick={() => finish()} disabled={finishing} className="h-[62px] rounded-[18px] text-lg font-bold disabled:opacity-60" style={{ background: CYAN, color: '#0a0f1a' }}>
              {finishing ? 'Finishing…' : 'Finish workout'}
            </button>
          )}
          {!painOpen && (
            <button onClick={() => setPainOpen(true)} className="h-11 rounded-xl text-[13px] font-medium" style={{ border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
              Felt pain — tell Coach
            </button>
          )}
        </div>
      </div>
    </Dark>
  )
}

function describeSet(lt: string, s: WorkoutSet): string {
  if (lt === 'weight_reps') return `${formatKg(s.weight_kg || 0)} kg × ${s.reps}`
  if (lt === 'reps') return `${s.reps} reps`
  if (lt === 'time') return formatSeconds(s.seconds || 0)
  return [s.seconds ? `${Math.round(s.seconds / 60)} min` : null, s.distance_km ? `${s.distance_km} km` : null].filter(Boolean).join(' · ')
}

function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#0a0f1a] text-white flex justify-center">
      <div className="w-full max-w-[480px] min-h-[100dvh] flex flex-col">{children}</div>
    </div>
  )
}

function Stepper({ label, display, onMinus, onPlus }: { label: string; value: number | null; display: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[11px] text-[#94a3b8] tracking-[0.08em] uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <button onClick={onMinus} aria-label={`Less ${label}`} className="w-11 h-11 rounded-xl bg-white/5 text-[22px]">−</button>
        <p className="text-[26px] font-bold min-w-[56px] text-center tabular-nums">{display}</p>
        <button onClick={onPlus} aria-label={`More ${label}`} className="w-11 h-11 rounded-xl bg-white/5 text-[22px]">+</button>
      </div>
    </div>
  )
}

function NumberField({ label, value, step, onChange }: { label: string; value: number | null; step: number; onChange: (v: number | null) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-[11px] text-[#94a3b8] uppercase tracking-[0.08em]">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-12 rounded-xl border border-white/10 bg-[#0a0f1a] text-white text-center text-lg font-bold"
      />
    </label>
  )
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-[#121626] rounded-2xl px-3 py-3.5 flex flex-col gap-1">
      <p className="text-[22px] font-bold" style={color ? { color } : undefined}>{value}</p>
      <p className="text-[11px] text-[#94a3b8]">{label}</p>
    </div>
  )
}

function Check({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
  )
}

function Trophy() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0a0f1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}
