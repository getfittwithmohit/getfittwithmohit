'use client'

import { useEffect, useState } from 'react'
import { getActivePlan, getLogs } from '@/lib/supabase/queries/workouts'
import { todaysSession, type TodayState } from '@/lib/utils/workouts'
import { addDaysIST, istDate, todayIST } from '@/lib/utils/istDate'
import type { WorkoutLog, WorkoutPlan } from '@/lib/types/workouts'

const CYAN = '#00D4E8'

// Home-screen "Today's session" card. Hidden until the coach assigns a plan.
export function WorkoutCard({ clientId }: { clientId: string }) {
  const [data, setData] = useState<{ plan: WorkoutPlan; logs: WorkoutLog[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getActivePlan(clientId), getLogs(clientId, 40)])
      .then(([plan, logs]) => { if (!cancelled && plan) setData({ plan, logs }) })
      .catch(() => {}) // the card is optional; never break Home over it
    return () => { cancelled = true }
  }, [clientId])

  if (!data) return null
  const { plan, logs } = data
  const today = todayIST()
  const logDate = (l: WorkoutLog) => istDate(new Date(l.completed_at || l.started_at))
  const state: TodayState = todaysSession(plan, logs, today, logDate)
  if (state.kind === 'no_sessions') return null

  const completed = logs.filter((l) => l.status === 'completed')
  const weekStart = addDaysIST(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7))
  const doneThisWeek = completed.filter((l) => logDate(l) >= weekStart).length
  const lastHighFive = completed.find((l) => l.coach_high_five)
  const missedLately = completed.length > 0 && logDate(completed[0]) <= addDaysIST(today, -4)

  const session = state.kind === 'ready' ? state.session : state.kind === 'done_today' ? state.session : state.next
  const exerciseCount = session?.plan_exercises.length || 0
  const minutes = session ? Math.max(10, Math.round(session.plan_exercises.reduce((m, pe) => m + pe.sets * ((pe.target_seconds || 45) + pe.rest_seconds), 0) / 60)) : 0

  return (
    <div className="rounded-3xl p-6 mb-3 flex flex-col gap-4 text-white" style={{ background: 'linear-gradient(160deg, #1a1f3a 0%, #121732 100%)', border: '1px solid rgba(0,212,232,0.25)' }}>
      <div className="flex justify-between items-center">
        <p className="text-[11px] tracking-[0.14em] uppercase text-[#94a3b8] font-semibold">
          {state.kind === 'done_today' ? 'Done today' : state.kind === 'rest_day' ? 'Rest day' : missedLately ? 'Welcome back' : 'Today’s session'}
        </p>
        <p className="text-xs text-[#94a3b8]">{doneThisWeek}/{plan.sessions_per_week} this week</p>
      </div>

      {state.kind === 'done_today' ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">✓ {state.session.name} done</h2>
          <p className="text-sm text-[#cbd5e1]">{state.next ? `Next up: ${state.next.label} · ${state.next.name}` : 'Recover well tonight.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[30px] font-bold leading-tight">{session?.name}</h2>
          <p className="text-sm text-[#cbd5e1]">
            {state.kind === 'rest_day' ? 'Next session · ' : ''}~{minutes} min · {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {state.kind === 'ready' && (
        <a href="/workout" className="h-[58px] rounded-[18px] flex items-center justify-center gap-2.5 text-[17px] font-bold" style={{ background: CYAN, color: '#0a0f1a' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0f1a" aria-hidden="true"><polygon points="7,4 20,12 7,20" /></svg>
          {missedLately ? 'Start your comeback' : 'Start workout'}
        </a>
      )}
      {state.kind === 'rest_day' && state.next && (
        <a href={`/workout?session=${state.next.id}`} className="h-12 rounded-2xl flex items-center justify-center text-sm font-semibold" style={{ border: `1px solid ${CYAN}`, color: CYAN }}>
          Train anyway
        </a>
      )}

      {session?.coach_note && state.kind !== 'done_today' && (
        <p className="text-sm text-[#e2e8f0] leading-snug"><span className="text-[#94a3b8]">Coach Mohit: </span>{session.coach_note}</p>
      )}
      {lastHighFive && (
        <p className="text-sm text-[#e2e8f0]">🔥 Coach Mohit high-fived your {lastHighFive.session_name} session</p>
      )}
    </div>
  )
}
