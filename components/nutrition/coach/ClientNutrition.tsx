'use client'

import { useEffect, useState } from 'react'
import { getFoods } from '@/lib/supabase/queries/foods'
import {
  archivePlan, createPlan, getBlueprintTargets, getClientContext, getClientPlan, getTemplates, type NutritionPlan,
} from '@/lib/supabase/queries/nutritionPlans'
import { describeItem, emptyOption, newId, scaleDoc, LEVEL_LABEL, type ClientContext, type Level, type PlanDoc, type PlanItem, type PlanTargets } from '@/lib/nutrition/plan'
import type { Food, Nutrients } from '@/lib/nutrition/foods'
import { PlanEditor } from './PlanEditor'
import { confirmDialog, toast } from '@/lib/ui/feedback'
import { compressImage } from '@/lib/photos/progressPhotos'

interface MealPhoto { id: string; url: string; data: string; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; caption: string }
const MAX_PHOTOS = 15

// Shrink to 1024 px JPEG (iPhone HEIC converted) and read as base64 — photos
// are sent once to be read, never stored.
async function toMealPhoto(file: File): Promise<MealPhoto> {
  const blob = await compressImage(file, 1024, 0.7)
  const type = blob.type === 'image/png' || blob.type === 'image/webp' ? blob.type : 'image/jpeg'
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(new Error('Could not read the photo'))
    r.readAsDataURL(blob)
  })
  return { id: Math.random().toString(36).slice(2), url: URL.createObjectURL(blob), data: dataUrl.split(',')[1] || '', media_type: type as MealPhoto['media_type'], caption: '' }
}

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

interface DraftResponse {
  current: { meals: { name: string; time: string; items: PlanItem[]; note: string }[]; unmapped: string[] }
  gaps: string[]
  changes: { what: string; why: string }[]
  missing_foods: { name: string; why: string }[]
  plan: PlanDoc
  currentTotals: Nutrients
  planTotals: Nutrients
}

const field = 'w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white focus:outline-none focus:border-[#00D4E8]'

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
  const [mode, setMode] = useState<'build' | 'template'>('build')
  const [mealLog, setMealLog] = useState('')
  const [transcript, setTranscript] = useState('')
  const [notes, setNotes] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [draft, setDraft] = useState<DraftResponse | null>(null)
  const [photos, setPhotos] = useState<MealPhoto[]>([])
  const [adding, setAdding] = useState(false)

  const [dragging, setDragging] = useState(false)

  const isImage = (f: File) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)

  const addPhotos = async (files: FileList | File[] | null) => {
    const all = Array.from(files || []).filter(isImage)
    if (!all.length) return
    const list = all.slice(0, MAX_PHOTOS - photos.length)
    if (all.length > list.length) toast(`Up to ${MAX_PHOTOS} photos — pick the clearest ones.`)
    setAdding(true)
    try {
      const out: MealPhoto[] = []
      for (const f of list) {
        try { out.push(await toMealPhoto(f)) } catch { toast(`Couldn’t read ${f.name}`) }
      }
      setPhotos((p) => [...p, ...out])
    } finally {
      setAdding(false)
    }
  }

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

  const build = async () => {
    if (mealLog.trim().length < 40 && photos.length === 0) return toast('Add photos of their meals, or type what they eat in a day.')
    // Vercel accepts about 4.5 MB per request
    if (photos.reduce((t, p) => t + p.data.length, 0) > 4_000_000) return toast('These photos are too big to send together — remove a few and try again.')
    setBusy(true)
    try {
      const res = await fetch('/api/coach/nutrition/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId, mealLog, transcript, notes, level,
          images: photos.map((p) => ({ data: p.data, media_type: p.media_type, caption: p.caption })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDraft(data)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const openDraft = async () => {
    if (!draft) return
    setBusy(true)
    try {
      const p = await createPlan({ client_id: clientId, name: `${first}'s nutrition plan`, diet: ctx?.diet || null, draft: draft.plan })
      setPlan(p)
      setDraft(null)
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

  if (draft) {
    const byslug = new Map(foods.map((f) => [f.slug, f]))
    const r = Math.round
    const pt = draft.plan.targets
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-base font-semibold text-[#0f172a] m-0">{first}: now vs the new plan</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fef2f2] p-3">
              <p className="text-xs font-semibold text-[#b91c1c] m-0">What {first} eats now</p>
              <p className="text-lg font-bold text-[#0f172a] m-0">{r(draft.currentTotals.kcal)} kcal</p>
              <p className="text-sm text-[#0f172a] m-0">{r(draft.currentTotals.protein)} g protein</p>
              <p className="text-xs text-[#64748b] m-0">C {r(draft.currentTotals.carbs)} · F {r(draft.currentTotals.fat)} · fibre {r(draft.currentTotals.fibre)}</p>
            </div>
            <div className="rounded-xl bg-[#f0fdf4] p-3">
              <p className="text-xs font-semibold text-[#15803d] m-0">New plan (typical day)</p>
              <p className="text-lg font-bold text-[#0f172a] m-0">{r(draft.planTotals.kcal)} kcal</p>
              <p className="text-sm text-[#0f172a] m-0">{r(draft.planTotals.protein)} g protein</p>
              <p className="text-xs text-[#64748b] m-0">Target {pt.kcal} kcal · {pt.protein_g} g protein</p>
            </div>
          </div>
          {draft.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#64748b] m-0 mb-1">Biggest gaps today</p>
              <ul className="m-0 pl-5 list-disc text-sm text-[#0f172a] flex flex-col gap-0.5">{draft.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
          {draft.changes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#64748b] m-0 mb-1">Main changes</p>
              <ul className="m-0 pl-5 list-disc text-sm text-[#0f172a] flex flex-col gap-1">
                {draft.changes.map((c, i) => <li key={i}><span className="font-medium">{c.what}</span> <span className="text-[#64748b]">— {c.why}</span></li>)}
              </ul>
            </div>
          )}
        </div>

        <details className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
          <summary className="text-sm font-semibold text-[#0f172a] cursor-pointer">How the app read {first}’s food log</summary>
          <div className="flex flex-col gap-2 mt-3">
            {draft.current.meals.map((m, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-[#0f172a] m-0">{m.name}{m.time ? ` · ${m.time}` : ''}{m.note ? <span className="font-normal text-[#b45309]"> — {m.note}</span> : null}</p>
                <p className="text-xs text-[#64748b] m-0">{m.items.map((it) => describeItem(it, byslug.get(it.food), 2)).join(', ')}</p>
              </div>
            ))}
            {draft.current.unmapped.length > 0 && <p className="text-xs text-[#b45309] m-0">Couldn’t match: {draft.current.unmapped.join(', ')}</p>}
          </div>
        </details>

        {draft.missing_foods.length > 0 && (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4">
            <p className="text-sm font-semibold text-[#92400e] m-0 mb-1">Foods {first} eats that aren’t in your library yet</p>
            <ul className="m-0 pl-5 list-disc text-sm text-[#92400e]">{draft.missing_foods.map((f, i) => <li key={i}>{f.name} — {f.why}</li>)}</ul>
            <p className="text-xs text-[#92400e] m-0 mt-1">Add them in Nutrition → Food library, then use them in the plan.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setDraft(null)} className="h-11 rounded-xl border border-[#e2e8f0] text-sm text-[#0f172a]">Change inputs</button>
          <button onClick={openDraft} disabled={busy} className="h-11 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-50">
            {busy ? 'Opening…' : 'Open as draft →'}
          </button>
        </div>
        <p className="text-[11px] text-[#94a3b8] m-0 text-center">You’ll see every meal and option in the editor. {first} sees nothing until you publish.</p>
      </div>
    )
  }

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

        <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded-xl">
          {([['build', '✨ From what they eat'], ['template', 'From a template']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`py-2 rounded-lg text-xs font-semibold ${mode === k ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}>{l}</button>
          ))}
        </div>

        {mode === 'build' && (
          <div
            className="flex flex-col gap-3"
            onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); addPhotos(e.clipboardData.files) } }}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#64748b]">Photos of {first}’s meals or WhatsApp screenshots (up to {MAX_PHOTOS})</span>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.id} className="flex flex-col gap-1">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#f1f5f9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Meal photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs"
                          aria-label="Remove photo"
                        >✕</button>
                      </div>
                      <input
                        value={p.caption}
                        onChange={(e) => setPhotos((x) => x.map((y) => (y.id === p.id ? { ...y, caption: e.target.value } : y)))}
                        placeholder="Day, time"
                        className="w-full px-2 py-1 text-[11px] border border-[#e2e8f0] rounded-md"
                        aria-label={`Caption for photo ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_PHOTOS && (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); addPhotos(e.dataTransfer.files) }}
                  tabIndex={0}
                  className={`rounded-xl border-2 border-dashed text-sm text-[#0f172a] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${photos.length ? 'py-3' : 'py-6'} ${dragging ? 'border-[#00D4E8] bg-[#E6F7F9]' : 'border-[#cbd5e1] bg-[#fcfdfe]'} ${adding ? 'opacity-50' : ''}`}
                >
                  <input type="file" accept="image/*,.heic,.heif" multiple className="hidden" disabled={adding} onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                  <span className="font-medium">{adding ? 'Adding photos…' : dragging ? 'Drop the photos here' : photos.length ? '+ Add more photos' : '📷 Add meal photos'}</span>
                  {!adding && !dragging && <span className="text-[11px] text-[#94a3b8]">Tap to choose, or drag and drop. On a computer you can also paste (Cmd+V).</span>}
                </label>
              )}
              <span className="text-[11px] text-[#94a3b8]">Captions are optional — add the day and time if the photo doesn’t show it. Photos are only read to build the plan; they aren’t saved.</span>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#64748b]">And/or type what {first} eats {photos.length ? '(optional)' : '— paste 1–3 days as they sent it'}</span>
              <textarea
                value={mealLog}
                onChange={(e) => setMealLog(e.target.value)}
                rows={8}
                placeholder={'e.g.\n8 am – chai with 2 sugar, 2 marie biscuits\n10 am – poha 1 plate\n2 pm – 3 roti, dal, aloo sabzi, rice\n6 pm – chai, namkeen\n10 pm – 3 roti, paneer sabzi'}
                className={field}
              />
            </label>
            {showMore ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#64748b]">Call transcript or notes (optional)</span>
                  <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5} placeholder="Paste a call transcript or your notes — anything about their food, schedule, likes and problems" className={field} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#64748b]">Your instructions (optional)</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Keep his office canteen lunch. No whey yet. Dinner by 9 pm." className={field} />
                </label>
              </>
            ) : (
              <button onClick={() => setShowMore(true)} className="self-start text-xs font-medium text-[#007A8A]">+ Add a call transcript or your own instructions</button>
            )}
          </div>
        )}

        {mode === 'template' && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#64748b]">Start from</span>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white">
            {templates.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
            <option value="">A blank plan</option>
          </select>
          <span className="text-[11px] text-[#94a3b8]">Template portions are scaled to {first}’s calories. You can change everything after.</span>
        </label>
        )}

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

        <button onClick={mode === 'build' ? build : create} disabled={busy} className="h-11 rounded-xl bg-[#1a1f3a] text-[#00D4E8] text-sm font-semibold disabled:opacity-50">
          {busy ? (mode === 'build' ? `Building ${first}’s plan… (about a minute)` : 'Creating…') : mode === 'build' ? `Build ${first}’s plan` : 'Create draft'}
        </button>
        <p className="text-[11px] text-[#94a3b8] m-0 text-center">{first} sees nothing until you publish.</p>
      </div>
    </div>
  )
}
