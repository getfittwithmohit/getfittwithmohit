'use client'

import { useEffect, useState } from 'react'
import { createTemplate, getPlanList, type PlanListItem } from '@/lib/supabase/queries/workouts'
import { formatDayLabel } from '@/lib/utils/istDate'

export function PlansList() {
  const [plans, setPlans] = useState<PlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPlanList()
      .then((data) => { if (!cancelled) setPlans(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const create = async () => {
    if (!newName.trim()) return setError('Name the template first, e.g. "Upper / Lower 4-day".')
    setCreating(true)
    setError(null)
    try {
      const id = await createTemplate(newName)
      window.location.href = `/coach/dashboard/workouts/plans/${id}`
    } catch (err) {
      setError((err as Error).message)
      setCreating(false)
    }
  }

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading plans…</p>

  const templates = plans.filter((p) => !p.client_id)
  const clientPlans = plans.filter((p) => p.client_id && (showArchived || p.status === 'active'))

  const Row = ({ p }: { p: PlanListItem }) => (
    <a
      href={`/coach/dashboard/workouts/plans/${p.id}`}
      className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-[#f1f5f9] hover:bg-[#f8fafc] ${p.status === 'archived' ? 'opacity-60' : ''}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#0f172a] truncate">
          {p.client_name ? `${p.client_name} · ` : ''}{p.name}
        </span>
        <span className="block text-xs text-[#94a3b8] mt-0.5">
          {p.session_count} session{p.session_count === 1 ? '' : 's'} · {p.schedule_type === 'rolling' ? 'Rolling' : 'Fixed weekdays'}
          {p.start_date ? ` · starts ${formatDayLabel(p.start_date)}` : ''}
          {p.status === 'archived' ? ' · archived' : ''}
        </span>
      </span>
      <span className="text-xs text-[#2563eb]">Open →</span>
    </a>
  )

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-[#ef4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Templates</h2>
            <p className="text-xs text-[#94a3b8]">Build a programme once, then assign it to any client and personalise.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New template name"
              aria-label="New template name"
              className="h-10 px-3 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]"
            />
            <button
              onClick={create}
              disabled={creating}
              className="h-10 px-4 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Creating…' : '+ New template'}
            </button>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          {templates.length ? templates.map((p) => <Row key={p.id} p={p} />) : (
            <p className="text-sm text-[#94a3b8] text-center py-8">No templates yet — create your first above.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Client plans</h2>
            <p className="text-xs text-[#94a3b8]">Each client has one active plan. Assign from a template, or from the client’s profile.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#64748b]">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          {clientPlans.length ? clientPlans.map((p) => <Row key={p.id} p={p} />) : (
            <p className="text-sm text-[#94a3b8] text-center py-8">No client plans yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
