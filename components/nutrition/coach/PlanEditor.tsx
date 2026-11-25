'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultMeasure, type Food, type Nutrients } from '@/lib/nutrition/foods'
import {
  LEVEL_LABEL, dayTotals, describeItem, emptyOption, itemGrams, newId, optionTotals, planChecks,
  type ClientContext, type Level, type PlanDoc, type PlanItem, type PlanMeal, type PlanOption,
} from '@/lib/nutrition/plan'
import { getVersions, publishPlan, saveDraft, type NutritionPlan, type PlanVersion } from '@/lib/supabase/queries/nutritionPlans'
import { confirmDialog, toast } from '@/lib/ui/feedback'
import { AskAI } from './AskAI'

const input = 'w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]'
const small = 'text-[11px] font-medium text-[#64748b]'
const r0 = (n: number) => Math.round(n)

function Bar({ value, target, label, unit }: { value: number; target: number; label: string; unit: string }) {
  const pct = target > 0 ? Math.min(130, (value / target) * 100) : 0
  const off = target > 0 && Math.abs(value - target) > target * 0.1
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#64748b]">{label}</span>
        <span className={off ? 'text-[#b45309] font-semibold' : 'text-[#0f172a] font-semibold'}>
          {r0(value)} / {target} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: off ? '#f59e0b' : '#00D4E8' }} />
      </div>
    </div>
  )
}

function FoodPicker({ foods, allow, onPick, onClose }: { foods: Food[]; allow: (f: Food) => boolean; onPick: (f: Food) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = foods.filter((f) => f.is_active && allow(f))
    const hits = s ? list.filter((f) => `${f.name} ${f.local_name || ''}`.toLowerCase().includes(s)) : list.filter((f) => f.kind === 'dish')
    return hits.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'dish' ? -1 : 1)).slice(0, 12)
  }, [q, foods, allow])
  return (
    <div className="border border-[#00D4E8] rounded-xl p-2 bg-white flex flex-col gap-1">
      <div className="flex gap-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a dish or ingredient" className={input} />
        <button onClick={onClose} className="text-xs text-[#64748b] px-2">Close</button>
      </div>
      {matches.map((f) => {
        const m = defaultMeasure(f)
        return (
          <button key={f.id} onClick={() => onPick(f)} className="text-left px-2 py-1.5 rounded-lg hover:bg-[#f8fafc] flex justify-between gap-3">
            <span className="text-sm text-[#0f172a] min-w-0 truncate">{f.name} <span className="text-xs text-[#94a3b8]">{f.local_name}</span></span>
            <span className="text-xs text-[#94a3b8] whitespace-nowrap">{m.label} · {r0((f.protein_g * m.grams) / 100)} g P</span>
          </button>
        )
      })}
      {matches.length === 0 && <p className="text-xs text-[#94a3b8] px-2 py-2 m-0">No match. Add it in the Food library first.</p>}
    </div>
  )
}

function Totals({ n, protein }: { n: Nutrients; protein?: boolean }) {
  return (
    <span className="text-xs text-[#64748b]">
      {r0(n.kcal)} kcal · <span className={protein ? 'font-semibold text-[#0f172a]' : ''}>{r0(n.protein)} g protein</span> · C {r0(n.carbs)} · F {r0(n.fat)}
    </span>
  )
}

export function PlanEditor({
  plan: initial,
  foods,
  ctx,
  title,
  onPublished,
}: {
  plan: NutritionPlan
  foods: Food[]
  ctx: ClientContext | null
  title?: string
  onPublished?: (p: NutritionPlan) => void
}) {
  const [plan, setPlan] = useState(initial)
  const [doc, setDoc] = useState<PlanDoc>(initial.draft)
  const [name, setName] = useState(initial.name)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [picker, setPicker] = useState<string | null>(null) // option id
  const [note, setNote] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [versions, setVersions] = useState<PlanVersion[] | null>(null)
  const first = useRef(true)

  const byslug = useMemo(() => new Map(foods.map((f) => [f.slug, f])), [foods])
  const isTemplate = !plan.client_id
  const day = dayTotals(doc, byslug)
  const checks = planChecks(doc, byslug, ctx)
  const blocked = checks.some((c) => c.level === 'block')
  const dirty = JSON.stringify(doc) !== JSON.stringify(plan.published)

  // Autosave the draft a moment after each change.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(() => {
      setSaveState('saving')
      saveDraft(plan.id, { draft: doc, name: name.trim() || plan.name })
        .then(() => setSaveState('saved'))
        .catch((e: Error) => { setSaveState('error'); toast(e.message) })
    }, 800)
    return () => clearTimeout(t)
  }, [doc, name, plan.id, plan.name])

  const allow = useMemo(() => {
    const d = (ctx?.diet || (isTemplate ? plan.diet : '') || '').toLowerCase()
    if (d.includes('vegan')) return (f: Food) => f.is_vegan
    if (d.includes('jain')) return (f: Food) => f.is_jain_ok
    if (d.includes('egg')) return (f: Food) => f.diet !== 'nonveg'
    if (d.includes('non')) return () => true
    if (d.includes('veg')) return (f: Food) => f.diet === 'veg'
    return () => true
  }, [ctx, isTemplate, plan.diet])

  // ── doc updates ──
  const setMeals = (fn: (m: PlanMeal[]) => PlanMeal[]) => setDoc((d) => ({ ...d, meals: fn(d.meals) }))
  const updMeal = (id: string, patch: Partial<PlanMeal>) => setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const updOption = (mealId: string, optId: string, fn: (o: PlanOption) => PlanOption) =>
    setMeals((ms) => ms.map((m) => (m.id === mealId ? { ...m, options: m.options.map((o) => (o.id === optId ? fn(o) : o)) } : m)))
  const moveMeal = (i: number, dir: -1 | 1) => setMeals((ms) => {
    const j = i + dir
    if (j < 0 || j >= ms.length) return ms
    const c = [...ms]; [c[i], c[j]] = [c[j], c[i]]; return c
  })

  const publish = async () => {
    if (blocked) return toast('Fix the red items first.')
    if (!(await confirmDialog(isTemplate ? 'Save this template version?' : 'Publish this plan to the client now?'))) return
    setPublishing(true)
    try {
      const p = await publishPlan({ ...plan, name }, doc, note.trim())
      setPlan(p)
      setNote('')
      setVersions(null)
      toast(isTemplate ? 'Template saved.' : 'Published — the client sees it now.', 'success')
      onPublished?.(p)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  const restore = async (v: PlanVersion) => {
    if (!(await confirmDialog(`Load version ${v.version} into your draft? Your unpublished changes will be replaced.`))) return
    setDoc(v.doc)
    toast(`Version ${v.version} loaded into the draft. Publish to make it live.`, 'success')
  }

  const t = doc.targets
  const setTarget = (k: keyof typeof t, v: string) => setDoc((d) => ({ ...d, targets: { ...d.targets, [k]: Number(v) || 0 } }))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide m-0">{title || (isTemplate ? 'Template' : 'Nutrition plan')}</p>
          <span className={`text-[11px] ${saveState === 'error' ? 'text-[#b91c1c]' : 'text-[#94a3b8]'}`}>
            {saveState === 'saving' ? 'Saving draft…' : saveState === 'error' ? 'Not saved' : 'Draft saved'}
          </span>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} text-base font-semibold`} aria-label="Plan name" />
        <div className="grid grid-cols-3 gap-1 bg-[#f1f5f9] p-1 rounded-xl" role="radiogroup" aria-label="Level">
          {([1, 2, 3] as Level[]).map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={doc.level === l}
              onClick={() => setDoc((d) => ({ ...d, level: l }))}
              className={`py-2 rounded-lg text-xs font-semibold ${doc.level === l ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
            >
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#64748b] m-0">
          {plan.version > 0
            ? `${isTemplate ? 'Saved' : 'Published'} version ${plan.version}${plan.published_at ? ` · ${new Date(plan.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}${dirty ? ' · you have unpublished changes' : ''}`
            : 'Not published yet — the client can’t see it.'}
        </p>
      </div>

      <AskAI doc={doc} foods={byslug} clientId={plan.client_id} diet={ctx?.diet ?? plan.diet} onApply={setDoc} />

      {/* Targets + day */}
      <div className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide m-0">Daily targets</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {([['kcal', 'kcal'], ['protein_g', 'Protein g'], ['carbs_g', 'Carbs g'], ['fat_g', 'Fat g'], ['fibre_g', 'Fibre g'], ['water_l', 'Water L']] as const).map(([k, l]) => (
            <label key={k} className="flex flex-col gap-1"><span className={small}>{l}</span>
              <input value={t[k] || ''} inputMode="decimal" onChange={(e) => setTarget(k, e.target.value)} className="w-full px-2 py-2 text-sm border border-[#e2e8f0] rounded-lg" />
            </label>
          ))}
        </div>
        <p className="text-xs text-[#64748b] m-0 mt-1">A typical day (first option of every meal):</p>
        <Bar label="Protein" value={day.typical.protein} target={t.protein_g} unit="g" />
        <Bar label="Calories" value={day.typical.kcal} target={t.kcal} unit="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <Bar label="Carbs" value={day.typical.carbs} target={t.carbs_g} unit="g" />
          <Bar label="Fat" value={day.typical.fat} target={t.fat_g} unit="g" />
        </div>
        {day.low.kcal !== day.high.kcal && (
          <p className="text-xs text-[#94a3b8] m-0">Any combination of options: {r0(day.low.kcal)}–{r0(day.high.kcal)} kcal</p>
        )}
      </div>

      {checks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {checks.map((c, i) => (
            <p key={i} className={`text-sm m-0 px-3 py-2 rounded-xl border ${c.level === 'block' ? 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]' : 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'}`}>
              {c.level === 'block' ? '⛔ ' : '⚠️ '}{c.text}
            </p>
          ))}
        </div>
      )}

      {/* Rules */}
      <div className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide m-0">Rules for this client</p>
        {doc.rules.map((r, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={r} onChange={(e) => setDoc((d) => ({ ...d, rules: d.rules.map((x, j) => (j === i ? e.target.value : x)) }))} className={input} aria-label={`Rule ${i + 1}`} />
            <button onClick={() => setDoc((d) => ({ ...d, rules: d.rules.filter((_, j) => j !== i) }))} className="text-[#94a3b8] px-1" aria-label="Remove rule">✕</button>
          </div>
        ))}
        <button onClick={() => setDoc((d) => ({ ...d, rules: [...d.rules, ''] }))} className="self-start text-xs font-medium text-[#007A8A]">+ Add a rule</button>
      </div>

      {/* Meals */}
      {doc.meals.map((m, mi) => (
        <div key={m.id} className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input value={m.name} onChange={(e) => updMeal(m.id, { name: e.target.value })} className={`${input} font-semibold`} aria-label="Meal name" />
            <input value={m.time} onChange={(e) => updMeal(m.id, { time: e.target.value })} className="w-24 px-2 py-2 text-sm border border-[#e2e8f0] rounded-lg" aria-label="Time" placeholder="8:30 am" />
            <button onClick={() => moveMeal(mi, -1)} className="text-[#94a3b8] px-1" aria-label="Move up">↑</button>
            <button onClick={() => moveMeal(mi, 1)} className="text-[#94a3b8] px-1" aria-label="Move down">↓</button>
            <button
              onClick={async () => { if (await confirmDialog(`Remove ${m.name || 'this meal'}?`, { destructive: true })) setMeals((ms) => ms.filter((x) => x.id !== m.id)) }}
              className="text-[#94a3b8] px-1" aria-label="Remove meal"
            >✕</button>
          </div>

          {m.options.map((o, oi) => {
            const tot = optionTotals(o, byslug)
            return (
              <div key={o.id} className="border border-[#e2e8f0] rounded-xl p-3 flex flex-col gap-2 bg-[#fcfdfe]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#007A8A] whitespace-nowrap">Option {oi + 1}</span>
                  <input value={o.title} onChange={(e) => updOption(m.id, o.id, (x) => ({ ...x, title: e.target.value }))} placeholder="e.g. Besan chilla with curd" className={input} aria-label="Option title" />
                </div>
                {o.items.map((it, ii) => {
                  const f = byslug.get(it.food)
                  const n = f ? (f.protein_g * itemGrams(it)) / 100 : 0
                  const k = f ? (f.kcal * itemGrams(it)) / 100 : 0
                  const setItem = (patch: Partial<PlanItem>) => updOption(m.id, o.id, (x) => ({ ...x, items: x.items.map((y, j) => (j === ii ? { ...y, ...patch } : y)) }))
                  return (
                    <div key={ii} className="flex flex-wrap items-center gap-2 py-1 border-b border-[#f1f5f9] last:border-0">
                      <span className="flex-1 min-w-[9rem] text-sm text-[#0f172a]">
                        {f?.name || <span className="text-[#b91c1c]">{it.food} (missing)</span>}
                        <span className="block text-[11px] text-[#94a3b8]">{describeItem(it, f, 2).split(' · ')[1] || ''} · {r0(k)} kcal · {Math.round(n * 10) / 10} g P</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setItem({ qty: Math.max(0.5, it.qty - 0.5) })} className="w-7 h-7 rounded-full border border-[#e2e8f0] text-sm" aria-label="Less">−</button>
                        <input
                          value={it.qty}
                          inputMode="decimal"
                          onChange={(e) => setItem({ qty: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-12 text-center px-1 py-1 text-sm border border-[#e2e8f0] rounded-lg"
                          aria-label="Quantity"
                        />
                        <button onClick={() => setItem({ qty: it.qty + 0.5 })} className="w-7 h-7 rounded-full border border-[#e2e8f0] text-sm" aria-label="More">+</button>
                      </div>
                      {f && (
                        <select
                          value={it.measure}
                          onChange={(e) => { const mm = f.measures.find((x) => x.label === e.target.value); if (mm) setItem({ measure: mm.label, grams: mm.grams }) }}
                          className="max-w-[10rem] text-xs border border-[#e2e8f0] rounded-lg px-1.5 py-1.5 bg-white"
                          aria-label="Measure"
                        >
                          {f.measures.map((mm) => <option key={mm.label} value={mm.label}>{mm.label}</option>)}
                        </select>
                      )}
                      <button onClick={() => updOption(m.id, o.id, (x) => ({ ...x, items: x.items.filter((_, j) => j !== ii) }))} className="text-[#94a3b8] px-1" aria-label="Remove food">✕</button>
                    </div>
                  )
                })}
                {picker === o.id ? (
                  <FoodPicker
                    foods={foods}
                    allow={allow}
                    onClose={() => setPicker(null)}
                    onPick={(f) => {
                      const mm = defaultMeasure(f)
                      updOption(m.id, o.id, (x) => ({ ...x, items: [...x.items, { food: f.slug, qty: 1, measure: mm.label, grams: mm.grams }] }))
                      setPicker(null)
                    }}
                  />
                ) : (
                  <button onClick={() => setPicker(o.id)} className="self-start text-xs font-medium text-[#007A8A]">+ Add food</button>
                )}
                <label className="flex flex-col gap-1"><span className={small}>Why this works (the client sees this)</span>
                  <textarea value={o.why} onChange={(e) => updOption(m.id, o.id, (x) => ({ ...x, why: e.target.value }))} rows={2} className={input} />
                </label>
                <label className="flex flex-col gap-1"><span className={small}>Prep tip (optional)</span>
                  <input value={o.tip} onChange={(e) => updOption(m.id, o.id, (x) => ({ ...x, tip: e.target.value }))} className={input} />
                </label>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Totals n={tot} protein />
                  <div className="flex gap-3">
                    <button onClick={() => setMeals((ms) => ms.map((x) => (x.id === m.id ? { ...x, options: [...x.options.slice(0, oi + 1), { ...o, id: newId(), title: `${o.title} (copy)` }, ...x.options.slice(oi + 1)] } : x)))} className="text-xs text-[#64748b]">Duplicate</button>
                    <button onClick={() => updMeal(m.id, { options: m.options.filter((x) => x.id !== o.id) })} className="text-xs text-[#94a3b8]">Remove</button>
                  </div>
                </div>
              </div>
            )
          })}
          {m.options.length < 4 && (
            <button onClick={() => updMeal(m.id, { options: [...m.options, emptyOption()] })} className="self-start text-xs font-medium text-[#007A8A]">+ Add an option</button>
          )}
        </div>
      ))}
      <button
        onClick={() => setMeals((ms) => [...ms, { id: newId(), name: 'New meal', time: '', options: [emptyOption()] }])}
        className="h-11 rounded-xl border border-dashed border-[#94a3b8] text-sm text-[#64748b]"
      >
        + Add a meal
      </button>

      {/* Publish */}
      <div className="bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)] p-4 flex flex-col gap-3">
        {!isTemplate && (
          <label className="flex flex-col gap-1"><span className={small}>Note to the client about this version (shown as “What’s new”)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Lighter dinners this week — your sleep will thank you." className={input} />
          </label>
        )}
        <button onClick={publish} disabled={publishing || blocked || (!dirty && plan.version > 0)} className="h-11 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-40">
          {publishing ? 'Publishing…' : isTemplate ? 'Save template version' : plan.version > 0 ? 'Publish changes' : 'Publish to client'}
        </button>
        {plan.version > 0 && (
          versions === null ? (
            <button onClick={() => getVersions(plan.id).then(setVersions).catch((e: Error) => toast(e.message))} className="self-start text-xs text-[#64748b]">Version history</button>
          ) : (
            <div className="flex flex-col gap-1">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-[#f1f5f9] last:border-0">
                  <span className="text-[#0f172a] min-w-0">
                    v{v.version} · {new Date(v.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {v.change_note ? <span className="text-[#64748b]"> — {v.change_note}</span> : null}
                  </span>
                  <button onClick={() => restore(v)} className="text-[#007A8A] font-medium whitespace-nowrap">Load into draft</button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
