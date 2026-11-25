'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { getCached, setCached } from '@/lib/ui/cache'
import { Icon } from '@/components/ui/Icon'
import { WorkoutCard } from '@/components/home/WorkoutCard'
import { Badge, Card, Group, LargeTitle, Row, Screen, SectionTitle, Skeleton, T, ScreenSkeleton } from '@/components/ui/ios'
import { getActivePlan, getLogs } from '@/lib/supabase/queries/workouts'
import { isoWeekday, todaysSession } from '@/lib/utils/workouts'
import { addDaysIST, istDate, todayIST } from '@/lib/utils/istDate'
import type { WorkoutLog, WorkoutPlan } from '@/lib/types/workouts'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const logDate = (l: WorkoutLog) => istDate(new Date(l.completed_at || l.started_at))

// Train tab: this week at a glance, today's session, the whole plan, nutrition.
export default function TrainPage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()
  type TrainCache = { plan?: WorkoutPlan | null; logs?: WorkoutLog[]; plate?: { meals: number; kcal: number } | null }
  const cached = getCached<TrainCache>('train')
  const [plan, setPlan] = useState<WorkoutPlan | null | undefined>(cached?.plan)
  const [logs, setLogs] = useState<WorkoutLog[]>(cached?.logs ?? [])
  const [plate, setPlate] = useState<{ meals: number; kcal: number } | null>(cached?.plate ?? null)

  useEffect(() => {
    if (checking || loading || !client) return
    let cancelled = false
    Promise.all([getActivePlan(client.id), getLogs(client.id, 60)])
      .then(([p, l]) => {
        if (cancelled) return
        setPlan(p); setLogs(l)
        setCached<TrainCache>('train', { ...getCached<TrainCache>('train'), plan: p, logs: l })
      })
      .catch(() => { if (!cancelled) setPlan(null) })
    fetch('/api/plate/today')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return
        const pl = { meals: (j.meals || []).length, kcal: Math.round(j.totals?.calories || 0) }
        setPlate(pl)
        setCached<TrainCache>('train', { ...getCached<TrainCache>('train'), plate: pl })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [checking, loading, client])

  if (checking || loading) return <ScreenSkeleton title="Train" blocks={[110, 200, 72]} />

  const today = todayIST()
  const weekStart = addDaysIST(today, -(isoWeekday(today) - 1))
  const completed = logs.filter((l) => l.status === 'completed' && plan && l.plan_id === plan.id)
  const doneDates = new Set(completed.map(logDate))
  const doneThisWeek = new Set(completed.filter((l) => logDate(l) >= weekStart).map((l) => l.session_id))
  const state = plan ? todaysSession(plan, logs, today, logDate) : null
  const todayId = state && (state.kind === 'ready' || state.kind === 'done_today') ? state.session.id : null

  const sessions = plan
    ? plan.schedule_type === 'weekdays'
      ? [...plan.plan_sessions].sort((a, b) => (a.weekday ?? 8) - (b.weekday ?? 8) || a.sort_order - b.sort_order)
      : plan.plan_sessions
    : []

  return (
    <Screen>
      <LargeTitle eyebrow={client?.phase && client.phase !== 'Onboarding' ? `Week ${client.current_week}` : undefined} title="Train" />

      {plan === undefined ? (
        <>
          <Skeleton h={110} />
          <Skeleton h={200} />
        </>
      ) : !plan ? (
        <Card className="flex flex-col gap-1.5">
          <span className="text-base font-semibold">Your plan is on its way</span>
          <span className="text-[15px]" style={{ color: T.sec }}>Coach Mohit is building your workout plan. It will show up here as soon as it’s ready.</span>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">This week</span>
              <span className="text-sm" style={{ color: T.ter }}>{doneThisWeek.size} of {plan.sessions_per_week} sessions</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LETTERS.map((letter, i) => {
                const date = addDaysIST(weekStart, i)
                const done = doneDates.has(date)
                const isToday = date === today
                const planned = plan.schedule_type === 'weekdays' && plan.plan_sessions.some((s) => s.weekday === i + 1)
                return (
                  <span key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: T.ter }}>{letter}</span>
                    {done ? (
                      <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: T.cyan, color: '#0a0f1a' }} aria-label="Done">
                        <Icon name="check" size={16} strokeWidth={3} />
                      </span>
                    ) : (
                      <span
                        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold box-border"
                        style={isToday ? { border: `2px solid ${T.navy}`, color: T.navy } : { background: planned ? '#E6F7F9' : '#EEF2F6', color: T.ter }}
                      >
                        {isToday ? '' : planned ? '•' : '–'}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </Card>

          {client && <WorkoutCard clientId={client.id} />}

          <SectionTitle action={<Link href="/workout/plan" className="text-base font-semibold py-2.5 pl-3" style={{ color: T.teal }}>See full plan</Link>}>
            My plan
          </SectionTitle>
          <Group>
            {sessions.map((s, i) => (
              <Row
                key={s.id}
                icon="dumbbell"
                title={s.name}
                subtitle={[s.label, s.weekday ? ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][s.weekday] : null, `${s.plan_exercises.length} exercises`].filter(Boolean).join(' · ')}
                href={`/workout/plan?open=${s.id}`}
                trailing={s.id === todayId ? <Badge tint="teal">Today</Badge> : doneThisWeek.has(s.id) ? <Badge tint="green">Done</Badge> : undefined}
                last={i === sessions.length - 1}
              />
            ))}
          </Group>
        </>
      )}

      <SectionTitle>Nutrition</SectionTitle>
      <Group>
        <Row
          icon="camera"
          tint="amber"
          title="PEAK Plate"
          subtitle={plate && plate.meals ? `${plate.meals} meal${plate.meals === 1 ? '' : 's'} today · ${plate.kcal} kcal` : 'Snap a meal · calories, macros, swaps'}
          href="/plate"
          last
        />
      </Group>
    </Screen>
  )
}
