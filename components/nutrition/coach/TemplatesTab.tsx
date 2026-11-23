'use client'

import { useEffect, useState } from 'react'
import { getFoods } from '@/lib/supabase/queries/foods'
import { archivePlan, createPlan, getTemplates, type NutritionPlan } from '@/lib/supabase/queries/nutritionPlans'
import { emptyOption, newId } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import { PlanEditor } from './PlanEditor'
import { confirmDialog, toast } from '@/lib/ui/feedback'

const DIETS = ['Vegetarian', 'Eggetarian', 'Non-vegetarian', 'Jain', 'Vegan']

// Templates = reusable starting points. Giving one to a client scales its
// portions to that client's calories; editing a template never changes client
// plans already made from it.
export function TemplatesTab() {
  const [templates, setTemplates] = useState<NutritionPlan[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [open, setOpen] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diet, setDiet] = useState('Vegetarian')

  useEffect(() => {
    let cancelled = false
    Promise.all([getTemplates(), getFoods()])
      .then(([t, f]) => { if (!cancelled) { setTemplates(t); setFoods(f) } })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const create = async (from?: NutritionPlan) => {
    try {
      const src = from ? from.published || from.draft : null
      const p = await createPlan({
        client_id: null,
        name: from ? `${from.name} (copy)` : `${diet} template`,
        diet: from ? from.diet : diet,
        draft: src || {
          level: 2,
          targets: { kcal: 1800, protein_g: 100, carbs_g: 200, fat_g: 60, fibre_g: 30, water_l: 3 },
          rules: ['Protein first, in every meal'],
          meals: ['Breakfast', 'Lunch', 'Evening', 'Dinner'].map((name) => ({ id: newId(), name, time: '', options: [emptyOption()] })),
        },
      })
      setTemplates((t) => [...t, p])
      setOpen(p)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading templates…</p>
  if (error) return <p className="text-sm text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">{error}</p>

  if (open) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <button onClick={() => { setOpen(null); getTemplates().then(setTemplates).catch(() => {}) }} className="self-start text-xs text-[#64748b]">← All templates</button>
        <PlanEditor key={open.id} plan={open} foods={foods} ctx={null} title={`Template · ${open.diet || ''}`} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-3">
      <p className="text-sm text-[#64748b] m-0">
        Starting points for new plans. Giving a template to a client scales every portion to their calories; changing a template never changes plans already made from it.
      </p>
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden divide-y divide-[#f1f5f9]">
        {templates.map((t) => {
          const d = t.published || t.draft
          return (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3">
              <button onClick={() => setOpen(t)} className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-medium text-[#0f172a]">{t.name}</span>
                <span className="block text-xs text-[#94a3b8]">{t.diet} · {d.meals.length} meals · about {d.targets.kcal} kcal, {d.targets.protein_g} g protein</span>
              </button>
              <button onClick={() => create(t)} className="text-xs text-[#64748b]">Copy</button>
              <button
                onClick={async () => {
                  if (!(await confirmDialog(`Archive “${t.name}”? Client plans made from it are not affected.`, { destructive: true }))) return
                  archivePlan(t.id).then(() => setTemplates((x) => x.filter((y) => y.id !== t.id))).catch((e: Error) => toast(e.message))
                }}
                className="text-xs text-[#94a3b8]"
              >
                Archive
              </button>
            </div>
          )
        })}
        {templates.length === 0 && <p className="text-sm text-[#94a3b8] text-center py-8 m-0">No templates yet.</p>}
      </div>
      <div className="flex gap-2">
        <select value={diet} onChange={(e) => setDiet(e.target.value)} className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-2 bg-white">
          {DIETS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button onClick={() => create()} className="flex-1 h-10 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium">+ New blank template</button>
      </div>
    </div>
  )
}
