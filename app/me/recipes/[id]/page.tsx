'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Card, Screen, Skeleton, T } from '@/components/ui/ios'
import { Icon } from '@/components/ui/Icon'
import { go } from '@/lib/ui/navigate'
import { CookMode } from '@/components/recipes/CookMode'
import { ShareSheet } from '@/components/recipes/ShareSheet'
import { normaliseFoods, PROTEIN_TINT, shortName, swapWords } from '@/components/recipes/shared'
import {
  DIET_LABEL, applySwap, dietOf, fitsDiet, mainProtein, portionTotals, potAmount, potExtra,
  type Recipe,
} from '@/lib/nutrition/recipes'
import type { Food } from '@/lib/nutrition/foods'

const r0 = (n: number) => Math.round(n)
const SIZES = [1, 2, 3, 4, 5, 6]

export default function RecipePage() {
  const { checking } = useAuthGuard()
  const params = useParams()
  const id = params.id as string
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [foods, setFoods] = useState<Food[]>([])
  const [diet, setDiet] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [protein, setProtein] = useState<string | null>(null)
  const [people, setPeople] = useState<number>(() => {
    try { return Math.min(6, Math.max(1, Number(localStorage.getItem('gfm:cookFor')) || 1)) } catch { return 1 }
  })
  const [cooking, setCooking] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [vote, setVote] = useState<boolean | null>(() => {
    try { const v = localStorage.getItem(`gfm:rv:${id}`); return v === null ? null : v === '1' } catch { return null }
  })
  const [askVote, setAskVote] = useState(false)

  const sendVote = (liked: boolean) => {
    setVote(liked)
    setAskVote(false)
    try { localStorage.setItem(`gfm:rv:${id}`, liked ? '1' : '0') } catch { /* private mode */ }
    fetch('/api/me/recipes/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, liked }) }).catch(() => {})
  }

  useEffect(() => {
    let cancelled = false
    fetch(`/api/me/recipes?id=${encodeURIComponent(id)}`)
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error)))))
      .then((d) => {
        if (cancelled) return
        setRecipe(d.recipes[0])
        setFoods(normaliseFoods(d.foods))
        setDiet(d.diet)
      })
      .catch((e) => { if (!cancelled) setFailed((e as Error).message || 'Couldn’t load this recipe.') })
    return () => { cancelled = true }
  }, [id])

  const bySlug = useMemo(() => new Map(foods.map((f) => [f.slug, f])), [foods])

  // Protein options the client can actually eat: the recipe's own, then swaps
  const options = useMemo(() => {
    if (!recipe) return []
    const main = mainProtein(recipe)
    const list = [main?.food, ...recipe.swaps.map((s) => s.food)].filter((s): s is string => !!s && bySlug.has(s))
    return list.filter((s) => fitsDiet(bySlug.get(s)!, diet))
  }, [recipe, bySlug, diet])

  if (checking) return null

  const setFamily = (n: number) => {
    setPeople(n)
    try { localStorage.setItem('gfm:cookFor', String(n)) } catch { /* private mode */ }
  }

  if (failed || (recipe && options.length === 0 && foods.length > 0)) {
    return (
      <Screen>
        <BackLink />
        <Card><p className="m-0 text-[15px]" style={{ color: T.sec }}>{failed || 'This recipe doesn’t fit your diet. Ask Coach Mohit for an alternative.'}</p></Card>
      </Screen>
    )
  }

  if (!recipe) {
    return <Screen><BackLink /><Skeleton h={170} /><Skeleton h={120} /><Skeleton h={140} /><Skeleton h={260} /></Screen>
  }

  const chosen = protein && options.includes(protein) ? protein : options[0]
  const main = mainProtein(recipe)
  const ingredients = chosen && main && chosen !== main.food ? applySwap(recipe, chosen, bySlug) : recipe.ingredients
  const totals = portionTotals(ingredients, bySlug)
  const mainIng = ingredients.find((i) => i.is_protein)
  const mainFood = mainIng ? bySlug.get(mainIng.food) : undefined
  const swapNote = recipe.swaps.find((s) => s.food === chosen)?.note
  const d = dietOf(ingredients, bySlug)
  const tint = PROTEIN_TINT[recipe.protein_key] || '#F2F4F7'
  const origFood = main ? bySlug.get(main.food) : undefined
  const fromName = origFood ? shortName(origFood) : undefined
  const toName = mainFood ? shortName(mainFood) : undefined
  const title = swapWords(recipe.title, fromName, toName)
  const steps = recipe.steps.map((s) => ({ ...s, text: swapWords(s.text, fromName, toName) }))

  const pot = ingredients.map((i) => {
    const f = bySlug.get(i.food)
    return { slug: i.food, name: f ? shortName(f) : i.food, prep: i.prep, amount: potAmount(f, i.grams, people) }
  })
  const extras = recipe.extras.map((x) => potExtra(x, people))

  return (
    <Screen>
      <BackLink />

      {/* Hero */}
      <div className="rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ background: tint }}>
        <div className="absolute -right-6 -bottom-6 opacity-[0.12]" aria-hidden="true"><Icon name="plate" size={150} /></div>
        <div className="flex gap-2 flex-wrap relative">
          <span className="px-3 py-1 rounded-full bg-white text-[13px] font-bold" style={{ color: d.diet === 'nonveg' ? '#B91C1C' : d.diet === 'egg' ? '#B45309' : '#15803D' }}>{DIET_LABEL[d.diet]}</span>
          <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ background: T.navy, color: T.cyan }}>{recipe.minutes} min</span>
          {recipe.tags.includes('sunday_prep') && <span className="px-3 py-1 rounded-full bg-white text-[13px] font-bold" style={{ color: T.sec }}>Sunday prep</span>}
          {recipe.tags.includes('tiffin') && <span className="px-3 py-1 rounded-full bg-white text-[13px] font-bold" style={{ color: T.sec }}>Tiffin-friendly</span>}
        </div>
        <div className="relative">
          <h1 className="m-0 text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
          {recipe.equipment.length > 0 && <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>{recipe.equipment.join(' · ')}</p>}
        </div>
      </div>

      {/* Protein */}
      {options.length > 1 && (
        <Card className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold">Protein</span>
            <span className="text-[13px]" style={{ color: T.ter }}>Same masala, re-weighed for you</span>
          </div>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Protein">
            {options.map((s) => (
              <button key={s} role="radio" aria-checked={s === chosen} onClick={() => setProtein(s)}
                className="min-h-10 px-4 rounded-full text-[15px] font-semibold transition-colors"
                style={s === chosen ? { background: T.navy, color: '#fff' } : { background: '#F2F4F7', color: '#334155' }}>
                {shortName(bySlug.get(s)!)}
              </button>
            ))}
          </div>
          {swapNote && <p className="m-0 text-sm" style={{ color: T.teal }}>{swapNote}</p>}
        </Card>
      )}

      {/* Your portion */}
      <div className="rounded-3xl p-5" style={{ background: T.navy, color: '#fff' }}>
        <p className="m-0 text-xs font-bold tracking-[0.12em]" style={{ color: T.cyan }}>YOUR PORTION</p>
        <p className="m-0 mt-1 text-[21px] font-extrabold">
          {recipe.portion_label || '1 portion'}{mainFood && mainIng ? <span className="font-semibold text-white/70"> · {potAmount(mainFood, mainIng.grams, 1)} {shortName(mainFood).toLowerCase()}</span> : null}
        </p>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([[r0(totals.kcal), 'kcal', '#fff'], [`${r0(totals.protein)}g`, 'protein', T.cyan], [`${r0(totals.carbs)}g`, 'carbs', '#fff'], [`${r0(totals.fat)}g`, 'fat', '#fff']] as const).map(([v, l, c]) => (
            <div key={l}><p className="m-0 text-xl font-extrabold" style={{ color: c }}>{v}</p><p className="m-0 text-xs text-white/60">{l}</p></div>
          ))}
        </div>
      </div>

      {/* Family */}
      <Card className="flex flex-col gap-2.5">
        <div>
          <p className="m-0 text-base font-bold">Cooking for how many?</p>
          <p className="m-0 mt-0.5 text-sm" style={{ color: T.ter }}>One pot for the family. Your portion stays the same.</p>
        </div>
        <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Cooking for">
          {SIZES.map((n) => (
            <button key={n} role="radio" aria-checked={n === people} aria-label={`Cooking for ${n}`} onClick={() => setFamily(n)}
              className="min-h-11 rounded-xl text-base font-bold transition-colors"
              style={n === people ? { background: T.cyan, color: T.navy } : { background: '#F2F4F7', color: '#334155' }}>
              {n}
            </button>
          ))}
        </div>
      </Card>

      {/* Ingredients */}
      <Card className="flex flex-col">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-base font-bold">Ingredients</span>
          <span className="text-[13px]" style={{ color: T.ter }}>for {people} {people === 1 ? 'person' : 'people'}</span>
        </div>
        {pot.map((i) => (
          <div key={i.slug} className="flex justify-between gap-3 py-2.5 text-[15px]" style={{ borderTop: `1px solid ${T.line}` }}>
            <span>{i.name}{i.prep && <span style={{ color: T.ter }}> · {i.prep}</span>}</span>
            <span className="font-semibold whitespace-nowrap">{i.amount}</span>
          </div>
        ))}
        {extras.map((x) => (
          <div key={x.name} className="flex justify-between gap-3 py-2.5 text-[15px]" style={{ borderTop: `1px solid ${T.line}` }}>
            <span style={{ color: T.sec }}>{x.name}</span>
            <span className="whitespace-nowrap" style={{ color: T.sec }}>{x.amount}</span>
          </div>
        ))}
      </Card>

      {recipe.tip && (
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: '#FFFBEB', color: '#92400E' }}>
          <span className="flex-shrink-0 mt-0.5"><Icon name="bulb" size={20} /></span>
          <div><p className="m-0 text-sm font-bold">Where calories hide</p><p className="m-0 mt-0.5 text-[15px] leading-snug">{recipe.tip}</p></div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={() => setCooking(true)} className="min-h-14 rounded-2xl text-[17px] font-extrabold" style={{ background: T.cyan, color: T.navy }}>Start cooking</button>
        <button onClick={() => setSharing(true)} className="min-h-[52px] rounded-2xl text-base font-semibold bg-white" style={{ color: T.ink, boxShadow: `0 0 0 1px ${T.line}` }}>Send to whoever’s cooking</button>
      </div>

      {/* Method */}
      <Card className="flex flex-col gap-3">
        <span className="text-base font-bold">Method</span>
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: T.navy, color: T.cyan }}>{i + 1}</span>
            <p className="m-0 text-[15px] leading-relaxed pt-0.5">{s.text}{s.minutes ? <span style={{ color: T.ter }}> · {s.minutes} min</span> : null}</p>
          </div>
        ))}
      </Card>


      {/* Would you cook it again? Feeds Recipe Autopilot */}
      <div id="cook-again" className="rounded-3xl p-5 flex flex-col gap-3 transition-shadow" style={{ background: '#fff', boxShadow: askVote ? `0 0 0 2px ${T.cyan}` : '0 0 0 1px rgba(15,23,42,0.04)' }}>
        <p className="m-0 text-base font-bold">{vote === null ? 'Cooked it? Would you cook it again?' : vote ? 'Glad you liked it.' : 'Thanks — Coach Mohit will make it better.'}</p>
        <div className="grid grid-cols-2 gap-2">
          {([[true, 'Yes, again'], [false, 'Not really']] as const).map(([v, l]) => (
            <button key={l} onClick={() => sendVote(v)} aria-pressed={vote === v}
              className="min-h-12 rounded-2xl text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              style={vote === v ? { background: T.navy, color: '#fff' } : { background: '#F2F4F7', color: T.ink }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={v ? undefined : { transform: 'rotate(180deg)' }}><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
              {l}
            </button>
          ))}
        </div>
      </div>

      {cooking && (
        <CookMode
          title={title}
          steps={steps}
          ingredients={[...pot, ...extras.map((x) => ({ name: x.name, amount: x.amount }))]}
          onClose={() => setCooking(false)}
          onFinish={() => {
            setCooking(false)
            if (vote === null) {
              setAskVote(true)
              setTimeout(() => document.getElementById('cook-again')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
            }
          }}
        />
      )}
      {sharing && (
        <ShareSheet
          recipeId={recipe.id}
          title={title}
          people={people}
          ingredients={pot}
          extras={recipe.extras}
          steps={steps.map((s) => s.text)}
          tip={recipe.tip}
          swap={main && chosen !== main.food ? { from: main.food, to: chosen } : null}
          onClose={() => setSharing(false)}
        />
      )}
    </Screen>
  )
}

function BackLink() {
  return (
    <button onClick={() => (window.history.length > 1 ? window.history.back() : go('/me/recipes'))} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Back
    </button>
  )
}
