'use client'

import { useEffect, useMemo, useState } from 'react'
import { getFoods, saveFood, type FoodInput } from '@/lib/supabase/queries/foods'
import {
  ALLERGENS, CATEGORIES, CATEGORY_LABEL, SOURCE_LABEL, computeRecipe, defaultMeasure, kcalFrom, nutrientsFor, slugify,
  type Diet, type Food, type Measure, type RecipeItem,
} from '@/lib/nutrition/foods'
import { toast } from '@/lib/ui/feedback'

const field = 'w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]'
const label = 'text-xs font-medium text-[#64748b]'
const DIET_DOT: Record<Diet, string> = { veg: '#16a34a', egg: '#d97706', nonveg: '#dc2626' }
const DIET_LABEL: Record<Diet, string> = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' }

type Filter = 'all' | 'veg' | 'egg' | 'nonveg' | 'vegan' | 'jain' | 'fasting'

const r0 = (n: number) => Math.round(n)
const r1 = (n: number) => Math.round(n * 10) / 10

interface Draft {
  name: string
  local_name: string
  category: string
  kind: 'ingredient' | 'dish'
  protein_g: string
  carbs_g: string
  fat_g: string
  fibre_g: string
  diet: Diet
  is_vegan: boolean
  is_jain_ok: boolean
  is_fasting_ok: boolean
  allergens: string[]
  measures: { label: string; grams: string; default?: boolean }[]
  recipe: { slug: string; grams: string }[]
  serving: string
  yield_g: string
  notes: string
  verified: boolean
  is_active: boolean
}

function toDraft(f: Food): Draft {
  const dm = f.kind === 'dish' ? defaultMeasure(f) : null
  return {
    name: f.name, local_name: f.local_name || '', category: f.category, kind: f.kind,
    protein_g: String(f.protein_g), carbs_g: String(f.carbs_g), fat_g: String(f.fat_g), fibre_g: String(f.fibre_g),
    diet: f.diet, is_vegan: f.is_vegan, is_jain_ok: f.is_jain_ok, is_fasting_ok: f.is_fasting_ok, allergens: f.allergens,
    measures: f.measures.filter((m) => !(f.kind === 'dish' && m === dm)).map((m) => ({ label: m.label, grams: String(m.grams), default: m.default })),
    recipe: (f.recipe || []).map((r) => ({ slug: r.slug, grams: String(r.grams) })),
    serving: dm ? dm.label.replace(/\s*\(\d+(\.\d+)? g\)$/, '') : '1 katori',
    yield_g: String(f.recipe_yield_g || dm?.grams || ''),
    notes: f.notes || '', verified: f.verified, is_active: f.is_active,
  }
}

const NEW_INGREDIENT: Draft = {
  name: '', local_name: '', category: 'vegetables', kind: 'ingredient',
  protein_g: '', carbs_g: '', fat_g: '', fibre_g: '0', diet: 'veg', is_vegan: true, is_jain_ok: true, is_fasting_ok: false,
  allergens: [], measures: [{ label: '100 g', grams: '100' }], recipe: [], serving: '', yield_g: '', notes: '', verified: true, is_active: true,
}
const NEW_DISH: Draft = { ...NEW_INGREDIENT, category: 'sabzi', kind: 'dish', measures: [{ label: '100 g', grams: '100' }], serving: '1 katori', yield_g: '150' }

export function FoodLibrary() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [needsCheck, setNeedsCheck] = useState(false)
  const [selected, setSelected] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(NEW_INGREDIENT)
  const [saving, setSaving] = useState(false)
  const [ingSearch, setIngSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    getFoods()
      .then((d) => { if (!cancelled) setFoods(d) })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const bySlug = useMemo(() => new Map(foods.map((f) => [f.slug, f])), [foods])
  const unchecked = foods.filter((f) => !f.verified && f.is_active).length

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return foods.filter((f) => {
      if (q && !`${f.name} ${f.local_name || ''}`.toLowerCase().includes(q)) return false
      if (category !== 'all' && f.category !== category) return false
      if (needsCheck && f.verified) return false
      if (filter === 'veg' || filter === 'egg' || filter === 'nonveg') return f.diet === filter
      if (filter === 'vegan') return f.is_vegan
      if (filter === 'jain') return f.is_jain_ok
      if (filter === 'fasting') return f.is_fasting_ok
      return true
    })
  }, [foods, search, category, filter, needsCheck])

  const open = (f: Food | 'ingredient' | 'dish') => {
    if (f === 'ingredient' || f === 'dish') {
      setSelected('new')
      setDraft(f === 'dish' ? NEW_DISH : NEW_INGREDIENT)
    } else {
      setSelected(f.id)
      setDraft(toDraft(f))
    }
    setIngSearch('')
  }
  const current = selected && selected !== 'new' ? foods.find((f) => f.id === selected) || null : null
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const recipeItems: RecipeItem[] = draft.recipe.map((r) => ({ slug: r.slug, grams: Number(r.grams) || 0 }))
  const recipe = draft.kind === 'dish' ? computeRecipe(recipeItems, Number(draft.yield_g) || 0, bySlug) : null
  const p = Number(draft.protein_g) || 0, c = Number(draft.carbs_g) || 0, fa = Number(draft.fat_g) || 0, fib = Number(draft.fibre_g) || 0
  const per100 = recipe ? recipe.per100 : { kcal: kcalFrom(p, c, fa, fib), protein_g: p, carbs_g: c, fat_g: fa, fibre_g: fib }

  const save = async () => {
    if (!draft.name.trim()) return toast('Give the food a name.')
    if (draft.kind === 'dish' && (recipeItems.filter((r) => r.grams > 0).length === 0 || !(Number(draft.yield_g) > 0))) {
      return toast('Add at least one ingredient and the cooked weight of one serving.')
    }
    const extra: Measure[] = draft.measures
      .filter((m) => m.label.trim() && Number(m.grams) > 0)
      .map((m) => ({ label: m.label.trim(), grams: Number(m.grams), ...(m.default ? { default: true } : {}) }))
    const measures: Measure[] = draft.kind === 'dish'
      ? [{ label: `${draft.serving.trim() || '1 serving'} (${Number(draft.yield_g)} g)`, grams: Number(draft.yield_g), default: true }, ...extra.map(({ default: _d, ...m }) => { void _d; return m })]
      : extra
    const input: FoodInput = {
      slug: current?.slug || slugify(draft.name),
      name: draft.name, local_name: draft.local_name || null, category: draft.category, kind: draft.kind,
      ...per100,
      diet: recipe ? recipe.diet : draft.diet,
      is_vegan: recipe ? recipe.is_vegan : draft.is_vegan,
      is_jain_ok: recipe ? recipe.is_jain_ok : draft.is_jain_ok,
      is_fasting_ok: draft.is_fasting_ok,
      allergens: recipe ? recipe.allergens : draft.allergens,
      measures: measures.length ? measures : [{ label: '100 g', grams: 100 }],
      recipe: draft.kind === 'dish' ? recipeItems.filter((r) => r.grams > 0) : null,
      recipe_yield_g: draft.kind === 'dish' ? Number(draft.yield_g) : null,
      source: current?.source || (draft.kind === 'dish' ? 'recipe' : 'coach'),
      source_ref: current?.source_ref || null,
      verified: recipe ? recipe.verified && draft.verified : draft.verified,
      notes: draft.notes.trim() || null,
      is_active: draft.is_active,
    }
    setSaving(true)
    try {
      const { saved, updatedDishes } = await saveFood(input, current?.id || null, foods)
      setFoods((fs) => {
        const map = new Map(fs.map((f) => [f.id, f]))
        for (const f of [saved, ...updatedDishes]) map.set(f.id, f)
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
      })
      setSelected(saved.id)
      setDraft(toDraft(saved))
      toast(updatedDishes.length ? `Saved. ${updatedDishes.length} dish${updatedDishes.length === 1 ? '' : 'es'} using it were updated.` : 'Saved.', 'success')
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[#94a3b8] text-center py-16">Loading foods…</p>
  if (error) return <p className="text-sm text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">{error}</p>

  const ingredientMatches = ingSearch.trim().length >= 2
    ? foods.filter((f) => f.kind === 'ingredient' && f.is_active && `${f.name} ${f.local_name || ''}`.toLowerCase().includes(ingSearch.trim().toLowerCase())).slice(0, 8)
    : []
  const serveG = draft.kind === 'dish' ? Number(draft.yield_g) || 0 : 0
  const perServing = recipe ? recipe.total : null

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
      {/* ── List ── */}
      <div className={`flex flex-col gap-3 min-w-0 ${selected ? 'hidden md:flex' : ''}`}>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods (English or local name)" className={field} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-1.5 bg-white" aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-1.5 bg-white" aria-label="Diet">
            <option value="all">All diets</option>
            <option value="veg">Veg</option>
            <option value="egg">Egg</option>
            <option value="nonveg">Non-veg</option>
            <option value="vegan">Vegan</option>
            <option value="jain">Jain-friendly</option>
            <option value="fasting">Fasting-friendly</option>
          </select>
          {unchecked > 0 && (
            <button
              onClick={() => setNeedsCheck((v) => !v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${needsCheck ? 'bg-[#fffbeb] border-[#f59e0b] text-[#b45309]' : 'border-[#e2e8f0] text-[#64748b] bg-white'}`}
            >
              To check · {unchecked}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => open('dish')} className="flex-1 h-9 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-medium">+ Dish (recipe)</button>
          <button onClick={() => open('ingredient')} className="flex-1 h-9 rounded-lg border border-[#1a1f3a] text-[#1a1f3a] text-sm font-medium">+ Ingredient</button>
        </div>
        <p className="text-xs text-[#94a3b8] m-0">{list.length} of {foods.length} foods</p>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden divide-y divide-[#f1f5f9]">
          {list.length === 0 && <p className="text-sm text-[#94a3b8] text-center py-10 m-0">No foods match.</p>}
          {list.map((f) => {
            const m = defaultMeasure(f)
            const n = nutrientsFor(f, m.grams)
            return (
              <button
                key={f.id}
                onClick={() => open(f)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#f8fafc] ${selected === f.id ? 'bg-[#E6F7F9]' : ''} ${f.is_active ? '' : 'opacity-50'}`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DIET_DOT[f.diet] }} aria-label={DIET_LABEL[f.diet]} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#0f172a] truncate">{f.name}</span>
                  <span className="block text-xs text-[#94a3b8] truncate">
                    {m.label} · {r0(n.kcal)} kcal · {r1(n.protein)} g protein
                  </span>
                </span>
                {!f.verified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309]">Check</span>}
                {f.kind === 'dish' && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b]">Dish</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Editor ── */}
      {selected ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 md:p-5 flex flex-col gap-4 md:sticky md:top-4 self-start w-full min-w-0">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setSelected(null)} className="text-xs text-[#64748b] md:hidden">← All foods</button>
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide m-0">
              {selected === 'new' ? (draft.kind === 'dish' ? 'New dish' : 'New ingredient') : draft.kind === 'dish' ? 'Dish' : 'Ingredient'}
            </p>
            {current && (
              <span className="text-[11px] text-[#64748b]">
                {SOURCE_LABEL[current.source]}{current.source_ref ? ` · ${current.source_ref}` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1"><span className={label}>Name</span>
              <input value={draft.name} onChange={(e) => set('name', e.target.value)} className={field} placeholder="e.g. Moong dal cheela" />
            </label>
            <label className="flex flex-col gap-1"><span className={label}>Local name</span>
              <input value={draft.local_name} onChange={(e) => set('local_name', e.target.value)} className={field} placeholder="e.g. Varan" />
            </label>
            <label className="flex flex-col gap-1"><span className={label}>Category</span>
              <select value={draft.category} onChange={(e) => set('category', e.target.value)} className={field}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </label>
          </div>

          {draft.kind === 'dish' ? (
            <div className="flex flex-col gap-3">
              <p className={`${label} m-0`}>Recipe for one serving (raw weights; leave out salt, spices and water)</p>
              <div className="flex flex-col gap-2">
                {draft.recipe.map((r, i) => {
                  const ing = bySlug.get(r.slug)
                  return (
                    <div key={`${r.slug}-${i}`} className="flex items-center gap-2">
                      <span className="flex-1 min-w-0 text-sm text-[#0f172a] truncate">{ing?.name || r.slug}</span>
                      <input
                        value={r.grams}
                        inputMode="decimal"
                        onChange={(e) => set('recipe', draft.recipe.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))}
                        className="w-20 px-2 py-1.5 text-sm border border-[#e2e8f0] rounded-lg text-right"
                        aria-label={`${ing?.name || r.slug} grams`}
                      />
                      <span className="text-xs text-[#94a3b8]">g</span>
                      <button onClick={() => set('recipe', draft.recipe.filter((_, j) => j !== i))} className="text-[#94a3b8] px-1" aria-label="Remove">✕</button>
                    </div>
                  )
                })}
              </div>
              <div className="relative">
                <input value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} placeholder="+ Add an ingredient (type to search)" className={field} />
                {ingredientMatches.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg overflow-hidden">
                    {ingredientMatches.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { set('recipe', [...draft.recipe, { slug: f.slug, grams: String(defaultMeasure(f).grams === 100 ? 50 : defaultMeasure(f).grams) }]); setIngSearch('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#f8fafc]"
                      >
                        {f.name} <span className="text-xs text-[#94a3b8]">{f.local_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1"><span className={label}>Serving name</span>
                  <input value={draft.serving} onChange={(e) => set('serving', e.target.value)} className={field} placeholder="1 katori" />
                </label>
                <label className="flex flex-col gap-1"><span className={label}>Cooked weight of one serving (g)</span>
                  <input value={draft.yield_g} inputMode="decimal" onChange={(e) => set('yield_g', e.target.value)} className={field} />
                </label>
              </div>
              {perServing && serveG > 0 && (
                <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-3">
                  <p className="text-xs text-[#64748b] m-0 mb-1">One serving · {draft.serving || 'serving'} ({serveG} g)</p>
                  <p className="text-base font-semibold text-[#0f172a] m-0">
                    {r0(perServing.kcal)} kcal · {r1(perServing.protein)} g protein
                  </p>
                  <p className="text-xs text-[#64748b] m-0">
                    Carbs {r1(perServing.carbs)} g · Fat {r1(perServing.fat)} g · Fibre {r1(perServing.fibre)} g
                  </p>
                  <p className="text-xs text-[#64748b] m-0 mt-1">
                    {DIET_LABEL[recipe!.diet]}{recipe!.is_vegan ? ' · Vegan' : ''}{recipe!.is_jain_ok ? ' · Jain-friendly' : ''}
                    {recipe!.allergens.length ? ` · Contains ${recipe!.allergens.join(', ')}` : ''}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className={`${label} m-0`}>Values per 100 g</p>
              <div className="grid grid-cols-4 gap-2">
                {([['protein_g', 'Protein'], ['carbs_g', 'Carbs'], ['fat_g', 'Fat'], ['fibre_g', 'Fibre']] as const).map(([k, l]) => (
                  <label key={k} className="flex flex-col gap-1"><span className="text-[11px] text-[#64748b]">{l} (g)</span>
                    <input value={draft[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} className="w-full px-2 py-2 text-sm border border-[#e2e8f0] rounded-lg" />
                  </label>
                ))}
              </div>
              <p className="text-sm text-[#0f172a] m-0">= <strong>{r0(per100.kcal)} kcal</strong> per 100 g</p>
              <div className="flex flex-wrap items-center gap-2">
                <select value={draft.diet} onChange={(e) => set('diet', e.target.value as Diet)} className="text-sm border border-[#e2e8f0] rounded-lg px-2 py-1.5 bg-white" aria-label="Diet">
                  <option value="veg">Veg</option><option value="egg">Egg</option><option value="nonveg">Non-veg</option>
                </select>
                {([['is_vegan', 'Vegan'], ['is_jain_ok', 'Jain-friendly']] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-1.5 text-sm text-[#0f172a]">
                    <input type="checkbox" checked={draft[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[#00D4E8]" />{l}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGENS.map((a) => {
                  const on = draft.allergens.includes(a)
                  return (
                    <button
                      key={a}
                      onClick={() => set('allergens', on ? draft.allergens.filter((x) => x !== a) : [...draft.allergens, a])}
                      className={`text-xs px-2.5 py-1 rounded-full border ${on ? 'bg-[#fef2f2] border-[#fca5a5] text-[#b91c1c]' : 'border-[#e2e8f0] text-[#64748b]'}`}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-1.5 text-sm text-[#0f172a]">
            <input type="checkbox" checked={draft.is_fasting_ok} onChange={(e) => set('is_fasting_ok', e.target.checked)} className="accent-[#00D4E8]" />
            Fasting-friendly (vrat)
          </label>

          <div className="flex flex-col gap-2">
            <p className={`${label} m-0`}>{draft.kind === 'dish' ? 'Other portion sizes' : 'Household measures'}</p>
            {draft.measures.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={m.label} onChange={(e) => set('measures', draft.measures.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-[#e2e8f0] rounded-lg" placeholder="1 katori" aria-label="Measure name" />
                <input value={m.grams} inputMode="decimal" onChange={(e) => set('measures', draft.measures.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))} className="w-20 px-2 py-1.5 text-sm border border-[#e2e8f0] rounded-lg text-right" aria-label="Grams" />
                <span className="text-xs text-[#94a3b8]">g</span>
                <button onClick={() => set('measures', draft.measures.filter((_, j) => j !== i))} className="text-[#94a3b8] px-1" aria-label="Remove measure">✕</button>
              </div>
            ))}
            <button onClick={() => set('measures', [...draft.measures, { label: '', grams: '' }])} className="self-start text-xs font-medium text-[#007A8A]">+ Add a measure</button>
          </div>

          <label className="flex flex-col gap-1"><span className={label}>Notes</span>
            <textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={field} />
          </label>

          <div className="flex flex-col gap-2">
            {draft.kind === 'ingredient' || recipe?.verified ? (
              <label className="flex items-center gap-1.5 text-sm text-[#0f172a]">
                <input type="checkbox" checked={draft.verified} onChange={(e) => set('verified', e.target.checked)} className="accent-[#00D4E8]" />
                Values checked
              </label>
            ) : (
              <p className="text-xs text-[#b45309] m-0">Uses an ingredient that still needs checking, so this dish shows “Check” until that ingredient is checked.</p>
            )}
            <label className="flex items-center gap-1.5 text-sm text-[#0f172a]">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-[#00D4E8]" />
              Available in plans
            </label>
          </div>

          <button onClick={save} disabled={saving} className="w-full h-11 rounded-lg bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : (
        <div className="hidden md:flex bg-white border border-dashed border-[#cbd5e1] rounded-2xl p-8 items-center justify-center text-center self-start">
          <p className="text-sm text-[#94a3b8] m-0">
            Pick a food to see and edit its values, or add your own.<br />
            Foods marked <span className="text-[#b45309] font-semibold">Check</span> use typical label values — confirm them once.
          </p>
        </div>
      )}
    </div>
  )
}
