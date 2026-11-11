'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import {
  addPlanExercise,
  addSession,
  copyPlan,
  deletePlan,
  deletePlanExercise,
  deleteSession,
  getExercises,
  getPlan,
  reorderPlanExercises,
  updatePlan,
  updatePlanExercise,
  updateSession,
} from '@/lib/supabase/queries/workouts'
import { todayIST } from '@/lib/utils/istDate'
import { LOG_TYPE_LABEL, WEEKDAYS, type Exercise, type PlanExercise, type WorkoutPlan } from '@/lib/types/workouts'

const cell = 'w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded-md bg-white focus:outline-none focus:border-[#00D4E8]'
const label = 'text-xs font-medium text-[#64748b]'

type ClientLite = { id: string; full_name: string }

export default function PlanBuilderPage() {
  const { checking } = useAuthGuard('coach')
  const params = useParams()
  const planId = params.id as string

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [clients, setClients] = useState<ClientLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignClient, setAssignClient] = useState('')
  const [assignStart, setAssignStart] = useState(todayIST())

  useEffect(() => {
    if (checking) return
    let cancelled = false
    Promise.all([
      getPlan(planId),
      getExercises(),
      supabase.from('clients').select('id, full_name, status').order('full_name'),
    ])
      .then(([p, lib, clientRes]) => {
        if (cancelled) return
        if (clientRes.error) throw new Error(clientRes.error.message)
        setPlan(p)
        setLibrary(lib.filter((e) => e.is_active))
        setClients((clientRes.data || []).filter((c) => (c.status || 'active') === 'active'))
        setSessionId((current) => (current && p?.plan_sessions.some((s) => s.id === current) ? current : p?.plan_sessions[0]?.id || null))
        setError(null)
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [checking, planId, reloadKey])

  // Every change saves straight away, then reloads so the screen shows what was stored
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      setReloadKey((k) => k + 1)
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const session = plan?.plan_sessions.find((s) => s.id === sessionId) || null
  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return library.filter((e) => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q)).slice(0, 8)
  }, [library, search])

  if (checking || loading) return <PageLoader />
  if (!plan) {
    return <p className="text-sm text-[#ef4444] text-center py-16">{error || 'Plan not found.'}</p>
  }

  const isTemplate = !plan.client_id
  const clientName = clients.find((c) => c.id === plan.client_id)?.full_name

  const numberOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

  const addExercise = (ex: Exercise) => {
    if (!session) return
    setSearch('')
    run(() => addPlanExercise(session.id, ex, session.plan_exercises.length))
  }

  const move = (index: number, dir: -1 | 1) => {
    if (!session) return
    const ids = session.plan_exercises.map((p) => p.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    run(() => reorderPlanExercises(ids))
  }

  const saveField = (pe: PlanExercise, changes: Parameters<typeof updatePlanExercise>[1]) => run(() => updatePlanExercise(pe.id, changes))

  const nextLabel = String.fromCharCode(65 + plan.plan_sessions.length)

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <button onClick={() => window.location.href = '/coach/dashboard/workouts'} className="text-white/40 hover:text-white/70 text-xs mb-1">
              ← Plans
            </button>
            <input
              defaultValue={plan.name}
              key={plan.name}
              aria-label="Plan name"
              onBlur={(e) => e.target.value.trim() && e.target.value !== plan.name && run(() => updatePlan(plan.id, { name: e.target.value.trim() }))}
              className="block bg-transparent text-white text-lg font-medium focus:outline-none border-b border-transparent focus:border-white/30 w-full"
            />
            <p className="text-white/40 text-xs mt-0.5">
              {isTemplate ? 'Template' : `${clientName || 'Client'}’s plan`} · {plan.status === 'archived' ? 'Archived' : 'Active'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => run(async () => {
                const id = await copyPlan(plan.id, null, null, `${plan.name} (template)`)
                window.location.href = `/coach/dashboard/workouts/plans/${id}`
              })}
              disabled={busy}
              className="h-10 px-4 rounded-full border border-white/20 text-white text-sm disabled:opacity-50"
            >
              Save as template
            </button>
            <button
              onClick={() => { setAssignOpen((v) => !v); setAssignClient(plan.client_id || '') }}
              className="h-10 px-4 rounded-full bg-[#00D4E8] text-[#0a0f1a] text-sm font-semibold"
            >
              Assign to client
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-4">
        {error && <p className="text-sm text-[#ef4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        {assignOpen && (
          <div className="bg-white border border-[#00D4E8] rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={label}>Client</span>
              <select className={cell} value={assignClient} onChange={(e) => setAssignClient(e.target.value)}>
                <option value="">Choose a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Starts</span>
              <input type="date" className={cell} value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
            </label>
            <button
              disabled={busy || !assignClient}
              onClick={() => run(async () => {
                const id = await copyPlan(plan.id, assignClient, assignStart, isTemplate ? plan.name : undefined)
                window.location.href = `/coach/dashboard/workouts/plans/${id}`
              })}
              className="h-9 px-4 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium disabled:opacity-50"
            >
              Assign
            </button>
            <p className="text-xs text-[#94a3b8] w-full">
              Makes a copy for the client that you can personalise. Their current plan (if any) is archived — their history stays.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-5 items-start">
          {/* Sessions + exercises */}
          <div className="flex-[999_1_620px] min-w-0 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {plan.plan_sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSessionId(s.id)}
                  className={`h-9 px-4 rounded-lg text-sm border ${
                    s.id === sessionId ? 'bg-[#1a1f3a] border-[#1a1f3a] text-white font-semibold' : 'bg-white border-[#e2e8f0] text-[#475569]'
                  }`}
                >
                  {s.label} · {s.name}
                </button>
              ))}
              <button
                disabled={busy || plan.plan_sessions.length >= 14}
                onClick={() => run(async () => {
                  const s = await addSession(plan.id, nextLabel, `Session ${nextLabel}`, plan.plan_sessions.length)
                  setSessionId(s.id)
                })}
                className="h-9 px-3 rounded-lg text-sm border border-dashed border-[#cbd5e1] text-[#64748b] disabled:opacity-50"
              >
                + Session
              </button>
            </div>

            {session && (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl">
                <div className="p-4 flex flex-wrap gap-3 items-end border-b border-[#e2e8f0]">
                  <label className="flex flex-col gap-1.5 w-16">
                    <span className={label}>Label</span>
                    <input key={`l-${session.id}-${session.label}`} defaultValue={session.label} maxLength={3} className={cell}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== session.label && run(() => updateSession(session.id, { label: e.target.value.trim() }))} />
                  </label>
                  <label className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                    <span className={label}>Session name</span>
                    <input key={`n-${session.id}-${session.name}`} defaultValue={session.name} className={cell}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== session.name && run(() => updateSession(session.id, { name: e.target.value.trim() }))} />
                  </label>
                  {plan.schedule_type === 'weekdays' && (
                    <label className="flex flex-col gap-1.5">
                      <span className={label}>Day</span>
                      <select className={cell} value={session.weekday || ''} onChange={(e) => run(() => updateSession(session.id, { weekday: numberOrNull(e.target.value) }))}>
                        <option value="">Not set</option>
                        {WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                      </select>
                    </label>
                  )}
                  <button
                    disabled={busy || plan.plan_sessions.length <= 1}
                    onClick={() => window.confirm(`Delete session ${session.label} and its exercises?`) && run(() => deleteSession(session.id))}
                    className="text-xs text-[#ef4444] underline disabled:opacity-40 h-9"
                  >
                    Delete session
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-[#64748b] border-b border-[#e2e8f0]">
                        <th className="px-3 py-2 font-semibold w-8">#</th>
                        <th className="px-2 py-2 font-semibold">Exercise</th>
                        <th className="px-2 py-2 font-semibold w-16">Sets</th>
                        <th className="px-2 py-2 font-semibold w-36">Target</th>
                        <th className="px-2 py-2 font-semibold w-20">Rest (s)</th>
                        <th className="px-2 py-2 font-semibold">Note</th>
                        <th className="px-2 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.plan_exercises.map((pe, i) => {
                        const lt = pe.exercise?.log_type || 'weight_reps'
                        return (
                          <tr key={pe.id} className="border-b border-[#f1f5f9] align-top">
                            <td className="px-3 py-2.5 text-[#94a3b8]">{i + 1}</td>
                            <td className="px-2 py-2.5">
                              <p className="font-medium text-[#0f172a]">{pe.exercise?.name || 'Exercise'}</p>
                              <p className="text-xs text-[#94a3b8]">{LOG_TYPE_LABEL[lt]}{pe.exercise && !pe.exercise.video_url ? ' · no video yet' : ''}</p>
                            </td>
                            <td className="px-2 py-2">
                              <input type="number" min={1} max={20} key={`s-${pe.id}-${pe.sets}`} defaultValue={pe.sets} className={cell} aria-label="Sets"
                                onBlur={(e) => Number(e.target.value) !== pe.sets && Number(e.target.value) >= 1 && saveField(pe, { sets: Number(e.target.value) })} />
                            </td>
                            <td className="px-2 py-2">
                              {(lt === 'weight_reps' || lt === 'reps') && (
                                <div className="flex items-center gap-1">
                                  <input type="number" min={1} key={`r-${pe.id}-${pe.target_reps}`} defaultValue={pe.target_reps ?? ''} className={cell} aria-label="Target reps"
                                    onBlur={(e) => numberOrNull(e.target.value) !== pe.target_reps && saveField(pe, { target_reps: numberOrNull(e.target.value) })} />
                                  <span className="text-xs text-[#94a3b8]">reps</span>
                                </div>
                              )}
                              {lt === 'time' && (
                                <div className="flex items-center gap-1">
                                  <input type="number" min={5} key={`t-${pe.id}-${pe.target_seconds}`} defaultValue={pe.target_seconds ?? ''} className={cell} aria-label="Target seconds"
                                    onBlur={(e) => numberOrNull(e.target.value) !== pe.target_seconds && saveField(pe, { target_seconds: numberOrNull(e.target.value) })} />
                                  <span className="text-xs text-[#94a3b8]">sec</span>
                                </div>
                              )}
                              {lt === 'time_distance' && (
                                <div className="flex items-center gap-1">
                                  <input type="number" min={1} key={`m-${pe.id}-${pe.target_seconds}`} defaultValue={pe.target_seconds ? Math.round(pe.target_seconds / 60) : ''} className={cell} aria-label="Target minutes"
                                    onBlur={(e) => {
                                      const mins = numberOrNull(e.target.value)
                                      const secs = mins === null ? null : mins * 60
                                      if (secs !== pe.target_seconds) saveField(pe, { target_seconds: secs })
                                    }} />
                                  <span className="text-xs text-[#94a3b8]">min</span>
                                  <input type="number" min={0} step={0.1} key={`d-${pe.id}-${pe.target_distance_km}`} defaultValue={pe.target_distance_km ?? ''} className={cell} aria-label="Target km"
                                    onBlur={(e) => numberOrNull(e.target.value) !== pe.target_distance_km && saveField(pe, { target_distance_km: numberOrNull(e.target.value) })} />
                                  <span className="text-xs text-[#94a3b8]">km</span>
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input type="number" min={0} max={600} step={15} key={`rest-${pe.id}-${pe.rest_seconds}`} defaultValue={pe.rest_seconds} className={cell} aria-label="Rest seconds"
                                onBlur={(e) => Number(e.target.value) !== pe.rest_seconds && saveField(pe, { rest_seconds: Number(e.target.value) || 0 })} />
                            </td>
                            <td className="px-2 py-2">
                              <input key={`note-${pe.id}-${pe.note}`} defaultValue={pe.note || ''} placeholder="e.g. 3-sec lowering" className={cell} aria-label="Note"
                                onBlur={(e) => (e.target.value.trim() || null) !== pe.note && saveField(pe, { note: e.target.value.trim() || null })} />
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button aria-label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)} className="w-7 h-7 border border-[#e2e8f0] rounded disabled:opacity-30">↑</button>
                                <button aria-label="Move down" disabled={busy || i === session.plan_exercises.length - 1} onClick={() => move(i, 1)} className="w-7 h-7 border border-[#e2e8f0] rounded disabled:opacity-30">↓</button>
                                <button aria-label="Remove" disabled={busy} onClick={() => run(() => deletePlanExercise(pe.id))} className="w-7 h-7 text-[#ef4444] disabled:opacity-30">✕</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border-t border-[#e2e8f0] relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="+ Add exercise — type to search the library"
                    aria-label="Add exercise"
                    className="w-full h-10 px-3 text-sm border border-dashed border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#00D4E8]"
                  />
                  {results.length > 0 && (
                    <div className="absolute left-3 right-3 bottom-full mb-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden z-10">
                      {results.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => addExercise(ex)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#f8fafc] flex justify-between gap-3"
                        >
                          <span className="text-[#0f172a]">{ex.name}</span>
                          <span className="text-xs text-[#94a3b8]">{ex.muscle_group} · {ex.equipment}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-[#e2e8f0]">
                  <label className="flex flex-col gap-1.5">
                    <span className={label}>Coach note for this session (client sees it on their home screen)</span>
                    <input
                      key={`cn-${session.id}-${session.coach_note}`}
                      defaultValue={session.coach_note || ''}
                      placeholder="e.g. Slow 3-second lowering on every press today."
                      className={cell}
                      onBlur={(e) => (e.target.value.trim() || null) !== session.coach_note && run(() => updateSession(session.id, { coach_note: e.target.value.trim() || null }))}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-3">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold">Schedule</p>
              <div className="flex gap-1 bg-[#f1f5f9] rounded-lg p-1">
                {(['rolling', 'weekdays'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => t !== plan.schedule_type && run(() => updatePlan(plan.id, { schedule_type: t }))}
                    className={`flex-1 h-8 rounded-md text-sm ${plan.schedule_type === t ? 'bg-white font-semibold text-[#0f172a]' : 'text-[#64748b]'}`}
                  >
                    {t === 'rolling' ? 'Rolling A→B→C' : 'Fixed weekdays'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#64748b] leading-relaxed">
                {plan.schedule_type === 'rolling'
                  ? 'The next session is always ready. A missed day never turns red.'
                  : 'Each session runs on its set day. Other days show as rest days. Set the day on each session.'}
              </p>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[#475569]">Sessions per week (target)</span>
                <input type="number" min={1} max={7} key={`spw-${plan.sessions_per_week}`} defaultValue={plan.sessions_per_week} className={`${cell} w-16`}
                  onBlur={(e) => Number(e.target.value) !== plan.sessions_per_week && Number(e.target.value) >= 1 && run(() => updatePlan(plan.id, { sessions_per_week: Math.min(7, Number(e.target.value)) }))} />
              </label>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold">Progression</p>
              <label className="flex items-start gap-2 text-sm text-[#334155] leading-relaxed">
                <input type="checkbox" className="mt-1 accent-[#00a3b5]" checked={plan.progression_enabled}
                  onChange={(e) => run(() => updatePlan(plan.id, { progression_enabled: e.target.checked }))} />
                When every set hits its reps and the session wasn’t rated “Brutal”, suggest one weight step up next time. After “Brutal”, hold the weight.
              </label>
            </div>

            {!isTemplate && (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold">Block</p>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#475569]">Starts</span>
                  <input type="date" key={`sd-${plan.start_date}`} defaultValue={plan.start_date || ''} className={`${cell} w-40`}
                    onChange={(e) => run(() => updatePlan(plan.id, { start_date: e.target.value || null }))} />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#475569]">Length (weeks)</span>
                  <input type="number" min={1} max={52} key={`w-${plan.weeks}`} defaultValue={plan.weeks ?? ''} className={`${cell} w-20`}
                    onBlur={(e) => numberOrNull(e.target.value) !== plan.weeks && run(() => updatePlan(plan.id, { weeks: numberOrNull(e.target.value) }))} />
                </label>
                {plan.client_id && (
                  <a href={`/coach/dashboard/client/${plan.client_id}`} className="text-xs text-[#2563eb] underline">Open {clientName || 'client'}’s profile →</a>
                )}
              </div>
            )}

            {(isTemplate || plan.status === 'archived') && (
              <button
                disabled={busy}
                onClick={() => window.confirm(`Delete "${plan.name}"? ${isTemplate ? 'Client plans made from it are not affected.' : ''}`) &&
                  run(async () => { await deletePlan(plan.id); window.location.href = '/coach/dashboard/workouts' })}
                className="text-xs text-[#ef4444] underline w-fit"
              >
                Delete {isTemplate ? 'template' : 'archived plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
