'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Card, LargeTitle, Screen, ScreenSkeleton, SectionTitle, Skeleton, T } from '@/components/ui/ios'
import { Icon, type IconName } from '@/components/ui/Icon'
import { MealOptions } from '@/components/eat/MealOptions'
import { useNutrition } from '@/components/eat/useNutrition'
import { currentMealIndex, nowMinutes } from '@/lib/nutrition/meals'
import type { Level } from '@/lib/nutrition/plan'

// Client: the Eat tab — the next meal front and centre, the rest of the day,
// then snapping a meal, the recipe book and the plan.
export default function EatPage() {
  const { checking } = useAuthGuard()
  const { data, failed, foods, recipeFor } = useNutrition()
  const [now, setNow] = useState(() => nowMinutes())
  const [open, setOpen] = useState<string | null>(null)

  // Move on to the next meal as the day goes by
  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (checking) return <ScreenSkeleton title="Eat" blocks={[96, 260, 120, 96]} />

  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  const doc = data?.plan?.doc
  const level = (doc?.level || 1) as Level
  const meals = doc?.meals || []
  const idx = currentMealIndex(meals, now)
  const dayDone = idx === -1 && meals.length > 0
  const nextIdx = dayDone ? 0 : idx
  const next = meals[nextIdx]
  const recipeCount = data?.recipes?.length ?? 0

  return (
    <Screen>
      <LargeTitle eyebrow={date} title="Eat" />

      {!data && !failed && <><Skeleton h={96} /><Skeleton h={260} /></>}
      {failed && !data && <Card><p className="m-0 text-[15px]" style={{ color: T.sec }}>Couldn’t load your plan. Check your connection and try again.</p></Card>}

      {data && !doc && (
        <Card>
          <p className="m-0 text-base font-semibold">Your plan is on its way</p>
          <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>Coach Mohit is building your nutrition plan around your food, your routine and your goal. Meanwhile, snap any meal for instant feedback, or browse the recipe book.</p>
        </Card>
      )}

      {doc && (
        <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: T.navy, color: '#fff' }}>
          <span className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,232,0.15)', color: T.cyan }}><Icon name="target" size={26} /></span>
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold tracking-[0.12em]" style={{ color: T.cyan }}>YOUR DAILY TARGET</p>
            <p className="m-0 mt-1 text-[22px] font-extrabold leading-tight">{doc.targets.protein_g} g protein{level === 3 ? <span className="text-base font-semibold text-white/60"> · {doc.targets.kcal} kcal</span> : null}</p>
            {meals.length > 1 && <p className="m-0 mt-0.5 text-sm text-white/60">About {Math.round(doc.targets.protein_g / meals.length / 5) * 5} g at every meal</p>}
          </div>
        </div>
      )}

      {next && (
        <>
          <SectionTitle action={next.time ? <span className="text-[15px]" style={{ color: T.ter }}>{next.time}</span> : undefined}>
            {dayDone ? `Tomorrow · ${next.name}` : `Next · ${next.name}`}
          </SectionTitle>
          {next.options.length > 1 && <p className="m-0 -mt-1 px-1 text-[15px]" style={{ color: T.ter }}>{next.options.length} options · pick any one</p>}
          <MealOptions key={next.id} options={next.options} foods={foods} level={level} recipeFor={recipeFor} />

          {meals.length > 1 && (
            <>
              <SectionTitle>{dayDone ? 'Tomorrow’s plate' : 'Rest of today'}</SectionTitle>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
                {meals.map((m, i) => ({ m, i })).filter((x) => x.i !== nextIdx).map(({ m, i }, k) => {
                  const isOpen = open === m.id
                  const past = !dayDone && i < nextIdx
                  return (
                    <div key={m.id} style={{ borderTop: k === 0 ? undefined : `1px solid ${T.line}` }}>
                      <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-4 min-h-14 text-left">
                        <span className="flex-1 min-w-0">
                          <span className="block text-base font-semibold" style={{ color: past ? T.ter : T.ink }}>{m.name}</span>
                          <span className="block text-[13px]" style={{ color: T.ter }}>{[m.time, `${m.options.length} option${m.options.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</span>
                        </span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}><path d="M9 18l6-6-6-6" /></svg>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 flex flex-col gap-2 gfm-page" style={{ background: '#F7F9FB' }}>
                          <div className="h-1" />
                          <MealOptions options={m.options} foods={foods} level={level} recipeFor={recipeFor} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Tile href="/plate" icon="camera" tint="#FEF3C7" color="#B45309" title="Snap a meal" sub="Eating out? Score it" />
        <Tile href="/me/recipes" icon="book" tint="#E7F6EC" color="#15803D" title="Recipe book" sub={recipeCount ? 'Cook your plate' : 'Sized for your family'} />
      </div>
      {doc && (
        <Link href="/me/nutrition" className="flex items-center gap-3 bg-white rounded-2xl p-4" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E6F7F9', color: T.teal }}><Icon name="clipboard" size={22} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-base font-semibold" style={{ color: T.ink }}>Your plan &amp; rules</span>
            <span className="block text-[13px]" style={{ color: T.ter }}>Every meal, every option, your targets</span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      )}
    </Screen>
  )
}

function Tile({ href, icon, tint, color, title, sub }: { href: string; icon: IconName; tint: string; color: string; title: string; sub: string }) {
  return (
    <Link href={href} className="bg-white rounded-2xl p-4 flex flex-col gap-2.5" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: tint, color }}><Icon name={icon} size={22} /></span>
      <span>
        <span className="block text-base font-semibold" style={{ color: T.ink }}>{title}</span>
        <span className="block text-[13px] mt-0.5" style={{ color: T.ter }}>{sub}</span>
      </span>
    </Link>
  )
}
