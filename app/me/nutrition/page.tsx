'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { Card, LargeTitle, Screen, SectionTitle, Skeleton, T } from '@/components/ui/ios'
import { describeItem, optionTotals, PLATE_RULES, type Level, type PlanDoc } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface Payload {
  recipes?: { id: string; title: string; dish_food: string; minutes: number }[]
  plan: { name: string; doc: PlanDoc; version: number; published_at: string | null; change_note: string | null } | null
  foods: Food[]
}

const LEVEL_NAME: Record<Level, string> = { 1: 'Habits', 2: 'Portions', 3: 'Numbers' }
const r0 = (n: number) => Math.round(n)

// Client: the nutrition plan Coach Mohit published, shown at the client's level.
export default function MyNutritionPage() {
  const { checking } = useAuthGuard()
  const [data, setData] = useState<Payload | null>(null)
  const [failed, setFailed] = useState(false)
  const [recent, setRecent] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/nutrition')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Payload) => {
        if (cancelled) return
        setData(d)
        const at = d.plan?.published_at
        setRecent(!!at && Date.now() - new Date(at).getTime() < 14 * 24 * 3600 * 1000)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const foods = useMemo(
    () => new Map((data?.foods || []).map((f) => [f.slug, { ...f, kcal: +f.kcal, protein_g: +f.protein_g, carbs_g: +f.carbs_g, fat_g: +f.fat_g, fibre_g: +f.fibre_g } as Food])),
    [data]
  )

  const recipesFor = useMemo(() => {
    const m = new Map<string, NonNullable<Payload['recipes']>>()
    for (const r of data?.recipes || []) m.set(r.dish_food, [...(m.get(r.dish_food) || []), r])
    return m
  }, [data])

  if (checking) return <PageLoader />

  const plan = data?.plan
  const doc = plan?.doc
  const level = (doc?.level || 1) as Level

  return (
    <Screen>
      <LargeTitle eyebrow="From Coach Mohit" title="My nutrition plan" />

      {!data && !failed && <><Skeleton h={120} /><Skeleton h={220} /></>}
      {failed && <Card><p className="m-0 text-[15px]" style={{ color: T.sec }}>Couldn’t load your plan. Check your connection and try again.</p></Card>}

      {data && !plan && (
        <Card>
          <p className="m-0 text-base font-semibold">Your plan is on its way</p>
          <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>Coach Mohit is building your nutrition plan around your food, your routine and your goal. You’ll see it here as soon as it’s ready.</p>
        </Card>
      )}

      {plan && doc && (
        <>
          {plan.change_note && recent && (
            <div className="rounded-2xl p-4" style={{ background: '#E6F7F9' }}>
              <p className="m-0 text-xs font-bold tracking-[0.08em] uppercase" style={{ color: T.teal }}>What’s new</p>
              <p className="m-0 mt-1 text-[15px] leading-snug">{plan.change_note}</p>
            </div>
          )}

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="m-0 text-xs font-bold tracking-[0.08em] uppercase" style={{ color: T.ter }}>Your daily target</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E6F7F9', color: T.teal }}>Level {level} · {LEVEL_NAME[level]}</span>
            </div>
            {level === 3 ? (
              <div className="grid grid-cols-4 gap-2 text-center">
                {([['kcal', doc.targets.kcal, ''], ['protein', doc.targets.protein_g, 'g'], ['carbs', doc.targets.carbs_g, 'g'], ['fat', doc.targets.fat_g, 'g']] as const).map(([l, v, u]) => (
                  <div key={l}>
                    <p className="m-0 text-xl font-bold">{v}{u}</p>
                    <p className="m-0 text-xs" style={{ color: T.ter }}>{l}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 text-2xl font-bold">{doc.targets.protein_g} g protein <span className="text-base font-medium" style={{ color: T.ter }}>a day</span></p>
            )}
            <p className="m-0 text-[15px]" style={{ color: T.sec }}>
              {level === 1 ? 'Build every plate the same way:' : level === 2 ? 'Portions are in katori, roti and palm sizes — no weighing needed.' : 'Weights are for cooked dishes, or raw where it says so.'}
            </p>
            {level === 1 && (
              <ul className="m-0 pl-5 list-disc flex flex-col gap-1 text-[15px]">
                {PLATE_RULES.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
            {doc.targets.water_l ? <p className="m-0 text-[15px]" style={{ color: T.sec }}>Water: {doc.targets.water_l} litres a day.</p> : null}
          </Card>

          <Link href="/me/recipes" className="flex items-center gap-3 bg-white rounded-2xl p-4" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
            <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FDF1E3', color: '#B45309' }}><Icon name="book" size={22} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-base font-semibold" style={{ color: T.ink }}>Recipe book</span>
              <span className="block text-[13px]" style={{ color: T.ter }}>Sized for your portion and your family</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </Link>

          {doc.rules.filter(Boolean).length > 0 && (
            <>
              <SectionTitle>Your rules</SectionTitle>
              <Card>
                <ol className="m-0 pl-5 list-decimal flex flex-col gap-1.5 text-[15px]">
                  {doc.rules.filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </Card>
            </>
          )}

          {doc.meals.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <SectionTitle action={m.time ? <span className="text-[15px]" style={{ color: T.ter }}>{m.time}</span> : undefined}>{m.name}</SectionTitle>
              {m.options.map((o, i) => {
                const tot = optionTotals(o, foods)
                return (
                  <Card key={o.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="m-0 text-base font-semibold leading-snug">
                        {m.options.length > 1 && <span className="text-xs font-bold mr-1.5" style={{ color: T.teal }}>OPTION {i + 1}</span>}
                        <span className="block">{o.title}</span>
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#F1F5F9', color: T.sec }}>
                        {r0(tot.protein)} g protein{level === 3 ? ` · ${r0(tot.kcal)} kcal` : ''}
                      </span>
                    </div>
                    <ul className="m-0 pl-5 list-disc flex flex-col gap-0.5 text-[15px]">
                      {o.items.map((it, j) => <li key={j}>{describeItem(it, foods.get(it.food), level).replace(' · ', ' — ')}</li>)}
                    </ul>
                    {o.why && <p className="m-0 text-[15px] leading-snug" style={{ color: T.teal }}>{o.why}</p>}
                    {[...new Set(o.items.map((it) => it.food))].flatMap((slug) => recipesFor.get(slug) || []).map((r) => (
                      <Link key={r.id} href={`/me/recipes/${r.id}`} className="mt-1 flex items-center justify-center gap-2 min-h-12 rounded-2xl text-[15px] font-bold" style={{ background: T.cyan, color: T.navy }}>
                        <Icon name="plate" size={18} />How to cook it · {r.minutes} min
                      </Link>
                    ))}
                    {o.tip && <p className="m-0 text-sm" style={{ color: T.ter }}>Tip: {o.tip}</p>}
                  </Card>
                )
              })}
            </div>
          ))}

          <p className="text-sm text-center mt-2 px-4" style={{ color: T.ter }}>
            Can’t get something on your plan? Swap it for another option in the same meal, or message Coach Mohit on WhatsApp.
          </p>
        </>
      )}
    </Screen>
  )
}
