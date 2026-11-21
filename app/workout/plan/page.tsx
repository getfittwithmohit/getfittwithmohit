'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { getActivePlan, getLogs } from '@/lib/supabase/queries/workouts'
import { describeTarget, formatSeconds, isoWeekday, todaysSession, youtubeSearchUrl } from '@/lib/utils/workouts'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import { addDaysIST, istDate, todayIST } from '@/lib/utils/istDate'
import type { PlanSession, WorkoutLog, WorkoutPlan } from '@/lib/types/workouts'

const CYAN = '#00D4E8'
const WEEKDAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// "My Workout Plan" — read-only view of the whole plan.
// Opening this page never starts a workout log; only "Start this session" does.
export default function WorkoutPlanPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [videoFor, setVideoFor] = useState<string | null>(null)

  useEffect(() => {
    if (checking || clientLoading) return
    let cancelled = false
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [p, l] = await Promise.all([getActivePlan(client.id), getLogs(client.id, 60)])
        if (cancelled) return
        setPlan(p)
        setLogs(l)
        if (p) {
          const state = todaysSession(p, l, todayIST(), logDate)
          const highlight = state.kind === 'ready' || state.kind === 'done_today' ? state.session : state.kind === 'rest_day' ? state.next : null
          setOpenId(highlight?.id || p.plan_sessions[0]?.id || null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your plan')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [checking, clientLoading, client])

  if (checking || clientLoading || loading) return <PageLoader />

  if (error || !plan) {
    return (
      <Shell>
        <p className="text-[#cbd5e1] text-sm text-center mt-16">
          {error || 'Coach Mohit hasn’t set up your workout plan yet.'}
        </p>
      </Shell>
    )
  }

  const today = todayIST()
  const state = todaysSession(plan, logs, today, logDate)
  const todayId = state.kind === 'ready' || state.kind === 'done_today' ? state.session.id : null
  const nextId = state.kind === 'rest_day' ? state.next?.id : state.kind === 'done_today' ? state.next?.id : null

  const weekStart = addDaysIST(today, -(isoWeekday(today) - 1))
  const doneThisWeek = new Set(
    logs
      .filter((l) => l.status === 'completed' && l.plan_id === plan.id && logDate(l) >= weekStart)
      .map((l) => l.session_id)
  )

  let weekLabel: string | null = null
  if (plan.start_date) {
    const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${plan.start_date}T00:00:00Z`)) / 86400000)
    if (days >= 0) {
      const week = Math.floor(days / 7) + 1
      weekLabel = plan.weeks ? `Week ${Math.min(week, plan.weeks)} of ${plan.weeks}` : `Week ${week}`
    }
  }

  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[11px] tracking-[0.14em] uppercase font-semibold" style={{ color: CYAN }}>My Workout Plan</p>
        <h1 className="text-2xl font-bold text-white mt-1">{plan.name}</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          {[weekLabel, `${plan.sessions_per_week} sessions / week`, `${doneThisWeek.size} done this week`].filter(Boolean).join(' · ')}
        </p>
        {plan.schedule_type === 'rolling' && (
          <p className="text-xs text-[#64748b] mt-2">Do the sessions in order — if you miss a day, just pick up with the next one.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {orderedSessions(plan).map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            isToday={s.id === todayId}
            isNext={s.id === nextId}
            done={doneThisWeek.has(s.id)}
            open={openId === s.id}
            onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            videoFor={videoFor}
            setVideoFor={setVideoFor}
          />
        ))}
      </div>
    </Shell>
  )
}

// Fixed-weekday plans read Mon → Sun; rolling plans keep the coach's order.
function orderedSessions(plan: WorkoutPlan) {
  if (plan.schedule_type !== 'weekdays') return plan.plan_sessions
  return [...plan.plan_sessions].sort((a, b) => (a.weekday ?? 8) - (b.weekday ?? 8) || a.sort_order - b.sort_order)
}

function logDate(l: WorkoutLog) {
  return istDate(new Date(l.completed_at || l.started_at))
}

function sessionMinutes(s: PlanSession) {
  return Math.max(10, Math.round(s.plan_exercises.reduce((m, pe) => m + pe.sets * ((pe.target_seconds || 45) + pe.rest_seconds), 0) / 60))
}

function SessionCard({
  session, isToday, isNext, done, open, onToggle, videoFor, setVideoFor,
}: {
  session: PlanSession
  isToday: boolean
  isNext: boolean
  done: boolean
  open: boolean
  onToggle: () => void
  videoFor: string | null
  setVideoFor: (id: string | null) => void
}) {
  const count = session.plan_exercises.length
  const tag = isToday ? 'Today' : isNext ? 'Next' : null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#121732', border: `1px solid ${isToday ? CYAN : 'rgba(255,255,255,0.08)'}` }}
    >
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3" aria-expanded={open}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-semibold">
              {[session.weekday ? WEEKDAYS[session.weekday] : null, session.label].filter(Boolean).join(' · ')}
            </span>
            {tag && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: CYAN, color: '#0a0f1a' }}>{tag}</span>
            )}
            {done && <span className="text-[11px] font-semibold text-[#22c55e]">✓ Done this week</span>}
          </div>
          <p className="text-white text-base font-semibold mt-1 truncate">{session.name}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {count} exercise{count === 1 ? '' : 's'} · ~{sessionMinutes(session)} min
          </p>
        </div>
        <span className="text-[#94a3b8] text-lg transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>⌄</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {session.coach_note && (
            <p className="text-sm text-[#e2e8f0] leading-snug rounded-xl p-3" style={{ background: 'rgba(0,212,232,0.08)' }}>
              <span className="text-[#94a3b8]">Coach Mohit: </span>{session.coach_note}
            </p>
          )}

          {count === 0 && <p className="text-sm text-[#94a3b8]">Your coach is still building this session.</p>}

          <ol className="flex flex-col gap-2">
            {session.plan_exercises.map((pe, i) => {
              const ex = pe.exercise
              const embed = getVideoEmbedUrl(ex?.video_url)
              const playing = videoFor === pe.id
              return (
                <li key={pe.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold w-5 pt-0.5" style={{ color: CYAN }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{ex?.name || 'Exercise'}</p>
                      <p className="text-xs text-[#cbd5e1] mt-0.5">
                        {ex ? describeTarget(pe, ex.log_type) : `${pe.sets} sets`}
                        {pe.rest_seconds ? ` · rest ${formatSeconds(pe.rest_seconds)}` : ''}
                      </p>
                      {pe.note && <p className="text-xs text-[#94a3b8] mt-1 italic">{pe.note}</p>}
                    </div>
                    {ex && (
                      embed ? (
                        <button
                          onClick={() => setVideoFor(playing ? null : pe.id)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ border: `1px solid ${CYAN}`, color: CYAN }}
                        >
                          {playing ? 'Close' : '▶ Demo'}
                        </button>
                      ) : (
                        <a
                          href={youtubeSearchUrl(ex.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 text-[#94a3b8]"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          ▶ Find demo
                        </a>
                      )
                    )}
                  </div>
                  {playing && embed && (
                    <div className="relative w-full mt-3 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
                        title={`${ex?.name} demo`}
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {count > 0 && (
            <a
              href={`/workout?session=${session.id}`}
              className="h-12 rounded-2xl flex items-center justify-center text-sm font-bold mt-1"
              style={isToday ? { background: CYAN, color: '#0a0f1a' } : { border: `1px solid ${CYAN}`, color: CYAN }}
            >
              {isToday ? 'Start today’s workout' : 'Start this session'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0f1a' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <a href="/home" className="text-white/40 hover:text-white/70 text-xs inline-flex items-center gap-1 mb-4">← Home</a>
        {children}
      </div>
    </div>
  )
}
