'use client'

import { useEffect, useMemo, useState } from 'react'
import { defaultMeasure, type Food } from '@/lib/nutrition/foods'
import {
  DIET_LABEL, MEAL_TYPES, PROTEIN_KEYS, PROTEIN_LABEL, RECIPE_TAGS, TAG_LABEL,
  dietOf, mainProtein, portionTotals, potAmount, recipeChecks, swapGrams,
  type MealType, type ProteinKey, type Recipe, type RecipeIngredient,
} from '@/lib/nutrition/recipes'
import { getFoods } from '@/lib/supabase/queries/foods'
import { deleteRecipe, getRecipes, setRecipeStatus, updateRecipe } from '@/lib/supabase/queries/recipes'
import { confirmDialog, toast } from '@/lib/ui/feedback'
import { Icon } from '@/components/ui/Icon'
import { AutopilotCard } from './AutopilotCard'

type Filter = Recipe['status']
const r0 = (n: number) => Math.round(n)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const card = 'bg-white rounded-3xl shadow-[0_0_0_1px_rgba(15,23,42,0.05)]'
const field = 'w-full px-3.5 py-2.5 bg-[#F2F4F7] border border-transparent rounded-xl text-[15px] focus:outline-none focus:bg-white focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15'
const label = 'text-xs font-bold text-[#475569] uppercase tracking-[0.12em]'
const chip = (on: boolean) => `min-h-9 px-3.5 rounded-full text-sm font-semibold transition-colors ${on ? 'bg-[#1a1f3a] text-white' : 'bg-[#F2F4F7] text-[#475569] hover:bg-[#E8ECF1]'}`
const primary = 'min-h-11 px-5 rounded-xl bg-[#00D4E8] text-[#1a1f3a] text-[15px] font-bold disabled:opacity-50'
const dark = 'min-h-11 px-5 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-[15px] font-semibold disabled:opacity-50'
const ghost = 'min-h-11 px-4 rounded-xl bg-white text-[#0f172a] text-[15px] font-semibold shadow-[0_0_0_1px_#E5E7EB] disabled:opacity-50'

// ── Food picker (ingredients only) ──────────────────────────────────────────

function IngredientPicker({ foods, onPick, onClose }: { foods: Food[]; onPick: (f: Food) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = foods.filter((f) => f.is_active && f.kind === 'ingredient')
    return (s ? list.filter((f) => `${f.name} ${f.local_name || ''} ${f.slug}`.toLowerCase().includes(s)) : list).slice(0, 10)
  }, [q, foods])
  return (
    <div className="rounded-2xl p-2 bg-white shadow-[0_0_0_1.5px_#00D4E8] flex flex-col gap-1">
      <div className="flex gap-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search an ingredient" className={field} />
        <button onClick={onClose} className="text-sm text-[#64748b] px-2">Close</button>
      </div>
      {matches.map((f) => (
        <button key={f.id} onClick={() => onPick(f)} className="text-left px-3 py-2 rounded-xl hover:bg-[#F2F4F7] flex justify-between gap-3">
          <span className="text-[15px] min-w-0 truncate">{f.name} <span className="text-sm text-[#94a3b8]">{f.local_name}</span></span>
          <span className="text-sm text-[#94a3b8] whitespace-nowrap">{f.protein_g} g P / 100 g</span>
        </button>
      ))}
      {matches.length === 0 && <p className="text-sm text-[#94a3b8] px-3 py-2 m-0">No match. Add it in the Food library first.</p>}
    </div>
  )
}

// ── Generator ───────────────────────────────────────────────────────────────

function Generator({ onDone }: { onDone: (added: Recipe[]) => void }) {
  const [proteins, setProteins] = useState<ProteinKey[]>([])
  const [meals, setMeals] = useState<MealType[]>([])
  const [count, setCount] = useState(10)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/coach/recipes/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proteins, meals, count, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not draft recipes')
      toast(`${data.recipes.length} new recipes ready to review`, 'success')
      onDone(data.recipes)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${card} p-5 flex flex-col gap-4`}>
      <div>
        <p className="m-0 text-[17px] font-bold">Draft new recipes</p>
        <p className="m-0 mt-1 text-[15px] text-[#64748b]">Written in your voice. Macros are calculated from your food library. Nothing reaches clients until you approve it.</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>Main protein (any if none picked)</span>
        <div className="flex flex-wrap gap-1.5">
          {PROTEIN_KEYS.map((p) => <button key={p} onClick={() => setProteins(toggle(proteins, p))} className={chip(proteins.includes(p))}>{PROTEIN_LABEL[p]}</button>)}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>Meals (any if none picked)</span>
        <div className="flex flex-wrap gap-1.5">
          {MEAL_TYPES.map((m) => <button key={m} onClick={() => setMeals(toggle(meals, m))} className={chip(meals.includes(m))}>{cap(m)}</button>)}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>Notes for the writer (optional)</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. More Maharashtrian dishes. Quick breakfasts for people who leave at 8." className={`${field} resize-none`} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-[#E4E8EE] rounded-xl p-1">
          {[5, 10].map((n) => (
            <button key={n} onClick={() => setCount(n)} className={`min-h-9 px-4 rounded-lg text-sm font-semibold ${count === n ? 'bg-white shadow-sm' : 'text-[#64748b]'}`}>{n} recipes</button>
          ))}
        </div>
        <button onClick={run} disabled={busy} className={`${primary} inline-flex items-center gap-2`}>
          {busy && <span className="w-4 h-4 rounded-full border-2 border-[#1a1f3a] border-t-transparent animate-spin" />}
          {busy ? `Writing ${count} recipes… 1–2 min` : 'Draft recipes'}
        </button>
      </div>
    </div>
  )
}

// ── Editor ──────────────────────────────────────────────────────────────────

function RecipeEditor({ recipe, foods, bySlug, onSaved, onDeleted }: {
  recipe: Recipe; foods: Food[]; bySlug: Map<string, Food>; onSaved: (r: Recipe) => void; onDeleted: (id: string) => void
}) {
  const [d, setD] = useState<Recipe>(recipe)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState<'ingredient' | 'swap' | null>(null)
  const [ask, setAsk] = useState('')
  const [asking, setAsking] = useState(false)
  const [proposal, setProposal] = useState<{ recipe: Omit<Recipe, 'id' | 'status'>; summary: string[] } | null>(null)

  const set = (patch: Partial<Recipe>) => { setD((p) => ({ ...p, ...patch })); setDirty(true) }
  const setIng = (idx: number, patch: Partial<RecipeIngredient>) =>
    set({ ingredients: d.ingredients.map((i, j) => (j === idx ? { ...i, ...patch } : patch.is_protein ? { ...i, is_protein: false } : i)) })

  const totals = portionTotals(d.ingredients, bySlug)
  const checks = recipeChecks(d, bySlug)
  const computed = dietOf(d.ingredients, bySlug)
  const main = mainProtein(d)
  const mainFood = main ? bySlug.get(main.food) : undefined
  const dishes = useMemo(() => foods.filter((f) => f.kind === 'dish' && f.is_active).sort((a, b) => a.name.localeCompare(b.name)), [foods])

  const save = async (status?: Recipe['status']) => {
    setBusy(true)
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = d
      void _c; void _u
      let saved = await updateRecipe(id, { ...rest, ...dietOf(d.ingredients, bySlug) })
      if (status) saved = await setRecipeStatus(id, status)
      setD(saved)
      setDirty(false)
      onSaved(saved)
      toast(status === 'approved' ? 'Approved — clients can see it now' : status === 'rejected' ? 'Rejected' : status === 'draft' ? 'Moved back to review' : 'Saved', 'success')
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const askAI = async () => {
    setAsking(true)
    setProposal(null)
    try {
      const res = await fetch('/api/coach/recipes/edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: d, instruction: ask }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not change the recipe')
      setProposal(data)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setAsking(false)
    }
  }

  const remove = async () => {
    if (!(await confirmDialog(`Delete “${d.title}” for good?`, { confirmLabel: 'Delete', destructive: true }))) return
    try { await deleteRecipe(d.id); onDeleted(d.id) } catch (e) { toast((e as Error).message) }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className={`${card} p-5 flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className={`m-0 ${label} !text-[#007A8A]`}>{d.status === 'approved' ? 'Approved · live for clients' : d.status === 'rejected' ? 'Rejected' : 'Draft · waiting for you'}</p>
            <input value={d.title} onChange={(e) => set({ title: e.target.value })} aria-label="Recipe title" className="mt-1 w-full bg-transparent text-[24px] font-extrabold tracking-tight focus:outline-none border-b border-transparent focus:border-[#00D4E8]" />
          </div>
          <span className="px-3 py-1.5 rounded-full bg-[#F0FDF4] text-[#15803D] text-[13px] font-bold whitespace-nowrap">Macros from your food library</span>
        </div>
        {d.review && (
          <div className={`rounded-2xl px-4 py-3 text-[15px] ${d.review.verdict === 'publish' ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFFBEB] text-[#92400E]'}`}>
            <b>AI reviewer:</b> {d.review.reason}
            {d.review.notes?.length ? <span className="block text-sm opacity-80 mt-0.5">Changed: {d.review.notes.join(' · ')}</span> : null}
          </div>
        )}
        {(d.likes || d.dislikes) ? <p className="m-0 text-sm text-[#475569]">Clients: 👍 {d.likes || 0} would cook again · 👎 {d.dislikes || 0} wouldn’t</p> : null}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold text-[#475569]">Main protein</span>
            <select value={d.protein_key} onChange={(e) => set({ protein_key: e.target.value as ProteinKey })} className={field}>
              {PROTEIN_KEYS.map((p) => <option key={p} value={p}>{PROTEIN_LABEL[p]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold text-[#475569]">Total minutes</span>
            <input type="number" min={1} value={d.minutes} onChange={(e) => set({ minutes: Number(e.target.value) || 1 })} className={field} />
          </label>
          <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold text-[#475569]">Portion looks like</span>
            <input value={d.portion_label || ''} onChange={(e) => set({ portion_label: e.target.value || null })} placeholder="1½ katori" className={field} />
          </label>
          <div className="flex flex-col gap-1"><span className="text-[13px] font-semibold text-[#475569]">Diet (from ingredients)</span>
            <span className="min-h-[44px] flex items-center px-3.5 rounded-xl bg-[#F7F9FB] text-[15px] font-semibold">{DIET_LABEL[computed.diet]}{computed.jain_ok ? ' · Jain OK' : ''}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MEAL_TYPES.map((m) => <button key={m} onClick={() => set({ meal_types: d.meal_types.includes(m) ? d.meal_types.filter((x) => x !== m) : [...d.meal_types, m] })} className={chip(d.meal_types.includes(m))}>{cap(m)}</button>)}
          <span className="w-px bg-[#E5E7EB] mx-1" />
          {RECIPE_TAGS.map((t) => <button key={t} onClick={() => set({ tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t] })} className={chip(d.tags.includes(t))}>{TAG_LABEL[t]}</button>)}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <div className="flex flex-col gap-3 min-w-0">
          {/* Ingredients */}
          <div className={`${card} p-5 flex flex-col gap-2`}>
            <div className="flex items-baseline justify-between"><span className={label}>Ingredients · one portion</span><span className="text-[13px] text-[#64748b]">Tap ● for the main protein</span></div>
            {d.ingredients.map((i, idx) => {
              const f = bySlug.get(i.food)
              const n = f ? r0((f.protein_g * i.grams) / 100) : 0
              return (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-t border-[#EEF1F4] first-of-type:border-t-0">
                  <button onClick={() => setIng(idx, { is_protein: true })} aria-label="Make this the main protein" className={`w-6 h-6 rounded-full flex-shrink-0 ${i.is_protein ? 'bg-[#1a1f3a] shadow-[inset_0_0_0_6px_#00D4E8]' : 'bg-[#F2F4F7] shadow-[inset_0_0_0_1.5px_#CBD5E1]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[15px] font-semibold truncate ${f ? '' : 'text-[#B91C1C]'}`}>{f?.name || `${i.food} (not in library)`}</div>
                    <input value={i.prep || ''} onChange={(e) => setIng(idx, { prep: e.target.value || undefined })} placeholder="prep, e.g. finely chopped" className="w-full bg-transparent text-[13px] text-[#64748b] focus:outline-none" />
                  </div>
                  <span className="text-[13px] text-[#94a3b8] w-14 text-right">{n} g P</span>
                  <input type="number" min={0} value={i.grams} onChange={(e) => setIng(idx, { grams: Number(e.target.value) || 0 })} aria-label="Grams" className="w-20 px-2 py-2 bg-[#F2F4F7] rounded-lg text-[15px] text-right focus:outline-none focus:ring-2 focus:ring-[#00D4E8]" />
                  <span className="text-[13px] text-[#64748b]">g</span>
                  <button onClick={() => set({ ingredients: d.ingredients.filter((_, j) => j !== idx) })} aria-label="Remove" className="w-8 h-8 rounded-full text-[#94a3b8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]">✕</button>
                </div>
              )
            })}
            {picker === 'ingredient'
              ? <IngredientPicker foods={foods} onClose={() => setPicker(null)} onPick={(f) => { set({ ingredients: [...d.ingredients, { food: f.slug, grams: defaultMeasure(f).grams, is_protein: false }] }); setPicker(null) }} />
              : <button onClick={() => setPicker('ingredient')} className="self-start text-[15px] font-semibold text-[#007A8A] min-h-10">+ Add ingredient</button>}

            <div className="mt-2 flex items-baseline justify-between"><span className={label}>Spices & herbs · not counted</span></div>
            {d.extras.map((x, idx) => (
              <div key={idx} className="flex gap-2">
                <input value={x.name} onChange={(e) => set({ extras: d.extras.map((y, j) => (j === idx ? { ...y, name: e.target.value } : y)) })} className={field} aria-label="Name" />
                <input value={x.amount} onChange={(e) => set({ extras: d.extras.map((y, j) => (j === idx ? { ...y, amount: e.target.value } : y)) })} className={`${field} !w-32`} aria-label="Amount per portion" />
                <button onClick={() => set({ extras: d.extras.filter((_, j) => j !== idx) })} aria-label="Remove" className="w-10 rounded-xl text-[#94a3b8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]">✕</button>
              </div>
            ))}
            <button onClick={() => set({ extras: [...d.extras, { name: '', amount: 'to taste' }] })} className="self-start text-[15px] font-semibold text-[#007A8A] min-h-10">+ Add spice or herb</button>
          </div>

          {/* Steps */}
          <div className={`${card} p-5 flex flex-col gap-2`}>
            <span className={label}>Steps · written for the family pot</span>
            {d.steps.map((s, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="w-7 h-7 mt-2 rounded-full bg-[#1a1f3a] text-[#00D4E8] text-sm font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <textarea rows={2} value={s.text} onChange={(e) => set({ steps: d.steps.map((y, j) => (j === idx ? { ...y, text: e.target.value } : y)) })} className={`${field} resize-none`} />
                <input type="number" min={0} value={s.minutes ?? 0} onChange={(e) => set({ steps: d.steps.map((y, j) => (j === idx ? { ...y, minutes: Number(e.target.value) || null } : y)) })} aria-label="Timer minutes" title="Timer minutes (0 = none)" className="w-16 mt-0.5 px-2 py-2.5 bg-[#F2F4F7] rounded-xl text-[15px] text-right focus:outline-none" />
                <button onClick={() => set({ steps: d.steps.filter((_, j) => j !== idx) })} aria-label="Remove step" className="w-8 h-8 mt-2 rounded-full text-[#94a3b8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]">✕</button>
              </div>
            ))}
            <button onClick={() => set({ steps: [...d.steps, { text: '', minutes: null }] })} className="self-start text-[15px] font-semibold text-[#007A8A] min-h-10">+ Add step</button>
            <span className={`${label} mt-2`}>Where calories hide</span>
            <textarea rows={2} value={d.tip || ''} onChange={(e) => set({ tip: e.target.value || null })} className={`${field} resize-none`} />
          </div>

          {/* Swaps */}
          <div className={`${card} p-5 flex flex-col gap-2`}>
            <div className="flex items-baseline justify-between gap-2"><span className={label}>Protein swaps</span><span className="text-[13px] text-[#64748b]">Re-weighed to match {mainFood ? mainFood.name.toLowerCase() : 'the main protein'}</span></div>
            {d.swaps.map((s, idx) => {
              const f = bySlug.get(s.food)
              const g = f ? swapGrams(d, f, bySlug) : null
              const delta = f && g !== null ? r0((f.kcal * g) / 100 - (mainFood && main ? (mainFood.kcal * main.grams) / 100 : 0)) : null
              return (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-t border-[#EEF1F4] first-of-type:border-t-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate">{f?.name || s.food} <span className="text-[#64748b] font-normal">· {g === null ? '?' : potAmount(f, g, 1)}</span>{delta !== null && <span className={`ml-1 text-[13px] font-semibold ${delta <= 0 ? 'text-[#15803D]' : 'text-[#B45309]'}`}>{delta > 0 ? '+' : ''}{delta} kcal</span>}</div>
                    <input value={s.note || ''} onChange={(e) => set({ swaps: d.swaps.map((y, j) => (j === idx ? { ...y, note: e.target.value || undefined } : y)) })} placeholder="what changes, e.g. press tofu 10 min" className="w-full bg-transparent text-[13px] text-[#64748b] focus:outline-none" />
                  </div>
                  <button onClick={() => set({ swaps: d.swaps.filter((_, j) => j !== idx) })} aria-label="Remove swap" className="w-8 h-8 rounded-full text-[#94a3b8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]">✕</button>
                </div>
              )
            })}
            {picker === 'swap'
              ? <IngredientPicker foods={foods} onClose={() => setPicker(null)} onPick={(f) => { if (!d.swaps.some((s) => s.food === f.slug)) set({ swaps: [...d.swaps, { food: f.slug }] }); setPicker(null) }} />
              : <button onClick={() => setPicker('swap')} className="self-start text-[15px] font-semibold text-[#007A8A] min-h-10">+ Add swap</button>}
            <label className="flex flex-col gap-1 mt-2"><span className={label}>Shows on clients’ plates for</span>
              <select value={d.dish_food || ''} onChange={(e) => set({ dish_food: e.target.value || null })} className={field}>
                <option value="">Not linked to a plan dish</option>
                {dishes.map((f) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Side: numbers, checks, actions */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-16">
          <div className={`${card} p-5`}>
            <span className={label}>Per portion</span>
            <div className="mt-1.5 text-[30px] font-extrabold tracking-tight">{r0(totals.kcal)} kcal</div>
            <div className="text-[15px] text-[#475569]"><b className="text-[#007A8A]">{r0(totals.protein)} g protein</b> · C {r0(totals.carbs)} · F {r0(totals.fat)} · fibre {r0(totals.fibre)}</div>
          </div>
          <div className={`${card} p-4 flex flex-col gap-1.5`}>
            {checks.map((c) => (
              <div key={c.label} className={`flex justify-between gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${c.ok ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFFBEB] text-[#B45309]'}`}>
                <span>{c.label}</span><span className="text-right">{c.value}</span>
              </div>
            ))}
          </div>
          {d.status !== 'approved' && <button onClick={() => save('approved')} disabled={busy} className={primary}>Approve and publish</button>}
          {dirty && <button onClick={() => save()} disabled={busy} className={dark}>Save changes</button>}
          <div className={`${card} p-4 flex flex-col gap-2`}>
            <span className={label}>Ask AI to change it</span>
            <textarea rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. Make it Jain. Use less paneer and add peas." className={`${field} resize-none`} />
            <button onClick={askAI} disabled={asking || !ask.trim()} className={dark}>{asking ? 'Rewriting…' : 'Propose a change'}</button>
            {proposal && (
              <div className="rounded-2xl bg-[#E6F7F9] p-3 flex flex-col gap-2">
                <ul className="m-0 pl-4 text-sm text-[#0f172a]">{proposal.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <p className="m-0 text-[13px] text-[#475569]">After: {r0(portionTotals(proposal.recipe.ingredients, bySlug).kcal)} kcal · {r0(portionTotals(proposal.recipe.ingredients, bySlug).protein)} g protein</p>
                <div className="flex gap-2">
                  <button onClick={() => { set({ ...proposal.recipe }); setProposal(null); setAsk('') }} className={`${primary} flex-1`}>Apply</button>
                  <button onClick={() => setProposal(null)} className={ghost}>Discard</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {d.status === 'approved' && <button onClick={() => save('draft')} disabled={busy} className={ghost}>Unpublish</button>}
            {d.status !== 'rejected' && <button onClick={() => save('rejected')} disabled={busy} className={ghost}>Reject</button>}
            {d.status === 'rejected' && <button onClick={() => save('draft')} disabled={busy} className={ghost}>Back to review</button>}
            {d.status === 'rejected' && <button onClick={remove} disabled={busy} className={`${ghost} !text-[#B91C1C]`}>Delete</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab ─────────────────────────────────────────────────────────────────────

export function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('draft')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showGen, setShowGen] = useState(false)

  useEffect(() => {
    Promise.all([getRecipes(), getFoods()])
      .then(([r, f]) => { setRecipes(r); setFoods(f) })
      .catch((e) => setError((e as Error).message))
  }, [])
  const reload = () => { getRecipes().then(setRecipes).catch(() => {}) }

  const bySlug = useMemo(() => new Map(foods.map((f) => [f.slug, f])), [foods])
  const counts = { draft: 0, approved: 0, rejected: 0 }
  for (const r of recipes || []) counts[r.status]++
  const list = (recipes || []).filter((r) => r.status === filter)
  const selected = (recipes || []).find((r) => r.id === selectedId) || null

  if (error) return <div className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-2xl px-4 py-3">{error}</div>
  if (!recipes) return <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-3xl gfm-shimmer" />)}</div>

  return (
    <div className="flex flex-col gap-3">
      <AutopilotCard onChanged={reload} />
      <div className={`${card} p-4 md:px-5 flex items-center justify-between gap-3 flex-wrap`}>
        <div className="flex gap-1.5 flex-wrap">
          {([['draft', 'Waiting for you'], ['approved', 'Live'], ['rejected', 'Rejected']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={chip(filter === k)}>{l} <span className="opacity-60">{counts[k]}</span></button>
          ))}
        </div>
        <button onClick={() => setShowGen((v) => !v)} className={`${ghost} inline-flex items-center gap-2`}><Icon name="sparkle" size={17} />{showGen ? 'Close' : 'Write specific recipes'}</button>
      </div>

      {showGen && <Generator onDone={(added) => { setRecipes((p) => [...added, ...(p || [])]); setFilter('draft'); setSelectedId(added[0]?.id || null); setShowGen(false) }} />}

      <div className="grid gap-3 md:grid-cols-[300px_minmax(0,1fr)] items-start">
        <div className={`${card} p-2 flex flex-col gap-0.5 ${selected ? 'hidden md:flex' : ''}`}>
          {list.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="m-0 text-[17px] font-semibold">{filter === 'draft' ? 'Nothing waiting for you' : filter === 'approved' ? 'No live recipes yet' : 'Nothing rejected'}</p>
              {filter === 'draft' && <p className="m-0 mt-1 text-[15px] text-[#64748b]">Autopilot only sends you recipes that need your judgement.</p>}
            </div>
          )}
          {list.map((r) => {
            const t = portionTotals(r.ingredients, bySlug)
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)} className={`text-left px-3 py-2.5 rounded-2xl transition-colors ${r.id === selectedId ? 'bg-[#E6F7F9]' : 'hover:bg-[#F7F9FB]'}`}>
                <div className="text-[15px] font-semibold">{r.title}</div>
                <div className="text-[13px] text-[#64748b] mt-0.5">{PROTEIN_LABEL[r.protein_key]} · {r.meal_types.map(cap).join(', ') || '—'} · {r.minutes} min · {r0(t.protein)} g P{(r.likes || r.dislikes) ? ` · 👍 ${r.likes || 0} 👎 ${r.dislikes || 0}` : ''}</div>
                {r.status === 'draft' && r.review?.reason && <div className="text-[13px] text-[#B45309] mt-1 leading-snug">{r.review.reason}</div>}
              </button>
            )
          })}
        </div>

        <div className="min-w-0">
          {selected ? (
            <>
              <button onClick={() => setSelectedId(null)} className="md:hidden mb-2 text-[17px] min-h-11 flex items-center gap-0.5 -ml-1 text-[#007A8A]">‹ All recipes</button>
              <RecipeEditor
                key={selected.id}
                recipe={selected}
                foods={foods}
                bySlug={bySlug}
                onSaved={(saved) => setRecipes((p) => (p || []).map((r) => (r.id === saved.id ? saved : r)))}
                onDeleted={(id) => { setRecipes((p) => (p || []).filter((r) => r.id !== id)); setSelectedId(null) }}
              />
            </>
          ) : (
            <div className={`${card} hidden md:flex flex-col items-center justify-center text-center px-8 py-20`}>
              <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] text-[#94a3b8] flex items-center justify-center mb-3"><Icon name="book" size={26} /></div>
              <p className="m-0 text-[17px] font-semibold">Pick a recipe to review</p>
              <p className="m-0 mt-1 text-[15px] text-[#64748b]">Check the numbers, tweak anything, then approve.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
