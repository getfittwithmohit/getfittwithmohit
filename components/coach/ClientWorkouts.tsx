'use client'

import { useEffect, useState } from 'react'
import {
  copyPlan,
  getActivePlan,
  getExercises,
  getLogs,
  getPainFlags,
  getPlanList,
  getSetsForLog,
  resolvePainFlag,
  sendHighFive,
  type PlanListItem,
} from '@/lib/supabase/queries/workouts'
import { formatKg, formatSeconds } from '@/lib/utils/workouts'
import { formatDayLabel, istDate, todayIST } from '@/lib/utils/istDate'
import type { Exercise, PainFlag, WorkoutLog, WorkoutPlan, WorkoutSet } from '@/lib/types/workouts'

const FEEL_LABEL = { easy: 'Easy', right: 'Just right', brutal: 'Brutal' } as const

// Coach view of one client's training: active plan, recent sessions with
// every set, pain reports, and one-tap high-fives.
export function ClientWorkouts({ clientId }: { clientId: string }) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [templates, setTemplates] = useState<PlanListItem[]>([])
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [flags, setFlags] = useState<PainFlag[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [openLog, setOpenLog] = useState<{ id: string; sets: WorkoutSet[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [startDate, setStartDate] = useState(todayIST())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getActivePlan(clientId), getPlanList(), getLogs(clientId, 30), getPainFlags(clientId), getExercises()])
      .then(([p, list, l, f, ex]) => {
        if (cancelled) return
        setPlan(p)
        setTemplates(list.filter((t) => !t.client_id))
        setLogs(l.filter((x) => x.status === 'completed'))
        setFlags(f)
        setExercises(Object.fromEntries(ex.map((e) => [e.id, e])))
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId])

  const assign = async () => {
    if (!templateId) return
    setBusy(true)
    setError(null)
    try {
      const id = await copyPlan(templateId, clientId, startDate)
      window.location.href = `/coach/dashboard/workouts/plans/${id}`
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const toggleLog = async (log: WorkoutLog) => {
    if (openLog?.id === log.id) return setOpenLog(null)
    try {
      setOpenLog({ id: log.id, sets: await getSetsForLog(log.id) })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const highFive = async (log: WorkoutLog) => {
    try {
      await sendHighFive(log.id)
      setLogs((ls) => ls.map((l) => (l.id === log.id ? { ...l, coach_high_five: true } : l)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const resolve = async (flag: PainFlag) => {
    try {
      await resolvePainFlag(flag.id)
      setFlags((fs) => fs.map((f) => (f.id === flag.id ? { ...f, resolved: true } : f)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading workouts…</p>

  const openFlags = flags.filter((f) => !f.resolved)
  const last28 = logs.filter((l) => l.completed_at && istDate(new Date(l.completed_at)) >= formatOffset(-27)).length
  const prCount = (sets: WorkoutSet[]) => sets.filter((s) => s.is_pr).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      {error && <p className="text-sm text-[#ef4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {openFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-red-700">⚠️ Pain reported · {openFlags.length} open</p>
          {openFlags.map((f) => (
            <div key={f.id} className="bg-white rounded-xl p-3 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0f172a]">{exercises[f.exercise_id || '']?.name || 'Exercise'}</p>
                <p className="text-xs text-[#94a3b8]">{formatDayLabel(istDate(new Date(f.created_at)))}</p>
                {f.note && <p className="text-sm text-[#0f172a] mt-1 whitespace-pre-wrap">{f.note}</p>}
              </div>
              <button onClick={() => resolve(f)} className="text-xs px-3 h-8 rounded-full border border-[#e2e8f0] text-[#64748b] shrink-0">Mark resolved</button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Training plan</p>
        {plan ? (
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="text-base font-semibold text-[#0f172a]">{plan.name}</p>
              <p className="text-xs text-[#94a3b8]">
                {plan.plan_sessions.length} sessions · {plan.schedule_type === 'rolling' ? 'Rolling' : 'Fixed weekdays'} · target {plan.sessions_per_week}/week
                {plan.start_date ? ` · started ${formatDayLabel(plan.start_date)}` : ''}
              </p>
            </div>
            <a href={`/coach/dashboard/workouts/plans/${plan.id}`} className="h-9 px-4 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium flex items-center">Edit plan</a>
          </div>
        ) : (
          <p className="text-sm text-[#64748b]">No plan yet — the client won’t see a workout until you assign one.</p>
        )}
        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-[#f1f5f9]">
          <label className="flex flex-col gap-1 text-xs text-[#64748b]">
            {plan ? 'Replace with a template' : 'Assign a template'}
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-9 px-2 text-sm border border-[#e2e8f0] rounded-lg bg-white">
              <option value="">Choose…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#64748b]">
            Starts
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 px-2 text-sm border border-[#e2e8f0] rounded-lg bg-white" />
          </label>
          <button onClick={assign} disabled={busy || !templateId} className="h-9 px-4 rounded-lg border border-[#1a1f3a] text-sm font-medium disabled:opacity-40">
            {busy ? 'Assigning…' : 'Assign'}
          </button>
          {templates.length === 0 && (
            <a href="/coach/dashboard/workouts" className="text-xs text-[#2563eb] underline">Create a template first →</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Sessions (28 days)" value={String(last28)} />
        <Tile label="Total sessions" value={String(logs.length)} />
        <Tile label="Last session" value={logs[0]?.completed_at ? formatDayLabel(istDate(new Date(logs[0].completed_at))) : '—'} />
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <p className="px-5 py-3 text-xs font-medium text-[#94a3b8] uppercase tracking-wide border-b border-[#e2e8f0]">Recent sessions</p>
        {logs.length === 0 && <p className="text-sm text-[#94a3b8] text-center py-10">No workouts logged yet.</p>}
        {logs.map((l) => (
          <div key={l.id} className="border-b border-[#f1f5f9]">
            <div className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <button onClick={() => toggleLog(l)} className="flex-1 min-w-[12rem] text-left">
                <p className="text-sm font-medium text-[#0f172a]">{l.session_name} <span className="text-[#2563eb] text-xs">{openLog?.id === l.id ? '▲' : '▼'}</span></p>
                <p className="text-xs text-[#94a3b8]">
                  {l.completed_at ? formatDayLabel(istDate(new Date(l.completed_at))) : ''}
                  {l.duration_seconds ? ` · ${formatSeconds(l.duration_seconds)}` : ''}
                  {l.total_volume_kg ? ` · ${Math.round(l.total_volume_kg).toLocaleString('en-IN')} kg` : ''}
                  {l.feel ? ` · felt ${FEEL_LABEL[l.feel]}` : ''}
                </p>
              </button>
              {l.coach_high_five ? (
                <span className="text-xs text-[#16a34a]">🔥 High-fived</span>
              ) : (
                <button onClick={() => highFive(l)} className="text-xs h-8 px-3 rounded-full border border-[#e2e8f0] hover:border-[#00D4E8]">🔥 High-five</button>
              )}
            </div>
            {openLog?.id === l.id && (
              <div className="px-5 pb-4">
                {openLog.sets.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">No sets recorded.</p>
                ) : (
                  <table className="w-full text-xs">
                    <tbody>
                      {openLog.sets.map((s) => (
                        <tr key={s.id} className={s.is_pr ? 'text-[#b45309] font-medium' : 'text-[#475569]'}>
                          <td className="py-1 pr-3">{exercises[s.exercise_id]?.name || 'Exercise'}</td>
                          <td className="py-1 pr-3">Set {s.set_number}</td>
                          <td className="py-1">
                            {s.weight_kg !== null ? `${formatKg(s.weight_kg)} kg × ${s.reps}`
                              : s.reps !== null ? `${s.reps} reps`
                              : [s.seconds ? formatSeconds(s.seconds) : null, s.distance_km ? `${s.distance_km} km` : null].filter(Boolean).join(' · ')}
                            {s.is_pr ? ' · PB' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="text-[11px] text-[#94a3b8] mt-2">{prCount(openLog.sets)} personal best{prCount(openLog.sets) === 1 ? '' : 's'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatOffset(days: number) {
  const d = new Date(`${todayIST()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-[#0f172a] mt-0.5">{value}</p>
    </div>
  )
}
