'use client'

import { useEffect, useState } from 'react'
import { getFoods } from '@/lib/supabase/queries/foods'
import {
  archivePlan, createPlan, getBlueprintTargets, getClientContext, getClientPlan, getTemplates, type NutritionPlan,
} from '@/lib/supabase/queries/nutritionPlans'
import { emptyOption, newId, scaleDoc, LEVEL_LABEL, type ClientContext, type Level, type PlanDoc, type PlanTargets } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import { PlanEditor } from './PlanEditor'
import { confirmDialog, toast } from '@/lib/ui/feedback'

const DEFAULT_RULES = [
  'Protein first, in every meal',
  'Half the plate sabzi or salad at lunch and dinner',
  'A glass of water before each meal — aim for 3 litres a day',
  'No sugar in tea or coffee; no packaged juices or cold drinks',
]

function blankDoc(level: Level, targets: PlanTargets): PlanDoc {
  const meal = (name: string, time: string) => ({ id: newId(), name, time, options: [emptyOption()] })
  return {
    level, targets, rules: DEFAULT_RULES,
    meals: [meal('Breakfast', '8:30 am'), meal('Mid-morning', '11:00 am'), meal('Lunch', '1:30 pm'), meal('Evening', '5:00 pm'), meal('Dinner', '8:30 pm')],
  }
}

const FALLBACK_TARGETS: PlanTargets = { kcal: 1800, protein_g: 100, carbs_g: 200, fat_g: 60, fibre_g: 30, water_l: 3 }

export function ClientNutrition({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [ctx, setCtx] = useState<ClientContext | null>(null)
  const [templates, setTemplates] = useState<NutritionPlan[]>([])
  const [bp, setBp] = useState<PlanTargets | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [level, setLevel] = useState<Level>(1)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getFoods(), getClientPlan(clientId), getClientContext(clientId), getTemplates(), getBlueprintTargets(clientId)])
      .then(([f, p, c, t, b]) => {
        if (cancelled) return
        setFoods(f); setPlan(p); setCtx(c); setTemplates(t); setBp(b)
        const d = (c.diet || '').toLowerCase()
        const match = t.find((x) => (x.diet || '').toLowerCase() === d) ||
          t.find((x) => d.includes('non') ? x.diet === 'Non-vegetarian' : d.includes('egg') ? x.diet === 'Eggetarian' : d.includes('vegan') ? x.diet === 'Vegan' : d.includes('jain') ? x.diet === 'Jain' : x.diet === 'Vegetarian')
        setTemplateId(match?.id || '')
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId])

  const first = clientName.split(' ')[0] || 'Client'

  const create = async () => {
    setBusy(true)
    try {
      const targets = bp || FALLBACK_TARGETS
      const tpl = templates.find((t) => t.id === templateId)
      let draft: PlanDoc
      if (tpl) {
        const src = tpl.published || tpl.draft
        const factor = src.targets.kcal > 0 ? targets.kcal / src.targets.kcal : 1
        draft = { ...scaleDoc(src, factor, new Map(foods.map((f) => [f.slug, f]))), level, targets }
      } else {
        draft = blankDoc(level, targets)
      }
      const p = await createPlan({ client_id: clientId, name: `${first}'s nutrition plan`, diet: ctx?.diet || null, draft })
      setPlan(p)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const replace = async () => {
    if (!plan) return
    if (!(await confirmDialog(`Start a new plan for ${first}? The current plan is archived (kept in the database) and ${first} sees nothing until you publish the new one.`, { destructive: true }))) return
    try {
      await archivePlan(plan.id)
      setPlan(null)
    } catch (e) {
      toast((e as Error).message)
    }
  }

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading nutrition…</p>
  if (error) return <p className="max-w-3xl mx-auto mt-6 text-sm text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">{error}</p>

  if (plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <PlanEditor key={plan.id} plan={plan} foods={foods} ctx={ctx} onPublished={setPlan} />
        <button onClick={replace} className="self-center text-xs text-[#94a3b8]">Start a new plan instead</button>
      </div>
    )
  }

  const t = bp || FALLBACK_TARGETS
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold text-[#0f172a] m-0">Create {first}’s nutrition plan</p>
          <p className="text-sm text-[#64748b] m-0 mt-1">
            {ctx?.diet ? `${ctx.diet}` : 'Diet not on file'}
            {ctx?.allergies ? ` · Allergies: ${ctx.allergies}` : ''}
            {ctx?.disliked ? ` · Dislikes: ${ctx.disliked}` : ''}
          </p>
        </div>

        <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-3">
          <p className="text-xs text-[#64748b] m-0 mb-1">{bp ? 'Targets from the Fat Loss Blueprint' : 'No Blueprint yet (height or weight missing) — starting targets, edit them in the plan'}</p>
          <p className="text-sm font-semibold text-[#0f172a] m-0">{t.kcal} kcal · {t.protein_g} g protein · {t.carbs_g} g carbs · {t.fat_g} g fat</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#64748b]">Start from</span>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white">
            {templates.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
            <option value="">A blank plan</option>
          </select>
          <span className="text-[11px] text-[#94a3b8]">Template portions are scaled to {first}’s calories. You can change everything after.</span>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#64748b]">Starting level</span>
          <div className="grid grid-cols-3 gap-1 bg-[#f1f5f9] p-1 rounded-xl">
            {([1, 2, 3] as Level[]).map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={`py-2 rounded-lg text-xs font-semibold ${level === l ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}>
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        <button onClick={create} disabled={busy} className="h-11 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-50">
          {busy ? 'Creating…' : 'Create draft'}
        </button>
        <p className="text-[11px] text-[#94a3b8] m-0 text-center">{first} sees nothing until you publish.</p>
      </div>
    </div>
  )
}
