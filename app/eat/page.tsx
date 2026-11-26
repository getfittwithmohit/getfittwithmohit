'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Card, LargeTitle, Screen, ScreenSkeleton, SectionTitle, Skeleton, T } from '@/components/ui/ios'
import { Icon, type IconName } from '@/components/ui/Icon'
import { MealOptions } from '@/components/eat/MealOptions'
import { CatchUp, ProteinRing, StatusChip, TickActions, TickedSummary } from '@/components/eat/Ticking'
import { useNutrition } from '@/components/eat/useNutrition'
import { useMealTicks } from '@/components/eat/useMealTicks'
import { currentMealIndex, nowMinutes } from '@/lib/nutrition/meals'
import { nextOpenMeal, proteinHint, summarise, type TickStatus } from '@/lib/nutrition/ticks'
import { celebrate } from '@/lib/ui/feel'
import { optionTotals, type Level, type PlanMeal } from '@/lib/nutrition/plan'

const EVENING = 19 * 60

// Client: the Eat tab. Protein ring, the next meal with one-tap ticking, the
// rest of the day, an evening catch-up, then snap / recipes / plan.
export default function EatPage() {
  const { checking } = useAuthGuard()
  const { data, failed, foods, recipeFor } = useNutrition()
  const { date, ticks, tick, undo } = useMealTicks(foods)
  const [now, setNow] = useState(() => nowMinutes())
  const [open, setOpen] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, number>>({})

  // Move on to the next meal as the day goes by
  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(t)
  }, [])

  const doc = data?.plan?.doc
  const meals = useMemo(() => doc?.meals || [], [doc])
  const target = doc?.targets.protein_g || 0
  const summary = useMemo(() => summarise(meals, ticks || []), [meals, ticks])

  // Confetti once on the day the ring fills
  const prev = useRef<number | null>(null)
  useEffect(() => {
    if (!ticks || !target) return
    const was = prev.current
    prev.current = summary.protein
    if (was === null || was >= target || summary.protein < target) return
    try {
      const k = `gfm:protein-hit:${date}`
      if (localStorage.getItem(k)) return
      localStorage.setItem(k, '1')
    } catch { /* storage off: celebrate anyway */ }
    celebrate()
  }, [summary.protein, target, ticks, date])

  if (checking) return <ScreenSkeleton title="Eat" blocks={[110, 260, 120, 96]} />

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  const level = (doc?.level || 1) as Level
  const byMeal = new Map((ticks || []).map((t) => [t.meal_id, t]))
  const clockIdx = currentMealIndex(meals, now)
  const nextIdx = ticks ? nextOpenMeal(meals, clockIdx, new Set(byMeal.keys())) : clockIdx
  const next = nextIdx >= 0 ? meals[nextIdx] : undefined
  const isPast = (i: number) => clockIdx === -1 || i < clockIdx
  const pickFor = (m: PlanMeal) => Math.min(picks[m.id] ?? 0, Math.max(0, m.options.length - 1))
  const ahead = meals.filter((m, i) => !byMeal.has(m.id) && !isPast(i))
  const mealsLeft = ahead.length
  const plannedLeft = ahead.reduce((t, m) => (m.options.length ? t + optionTotals(m.options[pickFor(m)], foods).protein : t), 0)
  const missing = meals.filter((m, i) => !byMeal.has(m.id) && i !== nextIdx && isPast(i))
  const catchUp = ticks && (now >= EVENING || clockIdx === -1) ? missing : []
  const allDone = !!ticks && meals.length > 0 && meals.every((m) => byMeal.has(m.id))
  const recipeCount = data?.recipes?.length ?? 0
  const setPick = (m: PlanMeal) => (i: number) => setPicks((p) => ({ ...p, [m.id]: i }))
  const onTick = (m: PlanMeal) => (status: TickStatus, i?: number) => { tick(m, status, i ?? pickFor(m)); setOpen(null) }

  return (
    <Screen>
      <LargeTitle eyebrow={dateLabel} title="Eat" />

      {!data && !failed && <><Skeleton h={110} /><Skeleton h={260} /></>}
      {failed && !data && <Card><p className="m-0 text-[15px]" style={{ color: T.sec }}>Couldn’t load your plan. Check your connection and try again.</p></Card>}

      {data && !doc && (
        <Card>
          <p className="m-0 text-base font-semibold">Your plan is on its way</p>
          <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>Coach Mohit is building your nutrition plan around your food, your routine and your goal. Meanwhile, snap any meal for instant feedback, or browse the recipe book.</p>
        </Card>
      )}

      {doc && (
        <ProteinRing target={target} summary={summary} kcalTarget={level === 3 ? doc.targets.kcal : undefined} hint={proteinHint(target, summary, mealsLeft, plannedLeft)} />
      )}

      {catchUp.length > 0 && <CatchUp meals={catchUp} onTick={(m, s, i) => tick(m, s, i ?? 0)} />}

      {next && (
        <>
          <SectionTitle action={next.time ? <span className="text-[15px]" style={{ color: T.ter }}>{next.time}</span> : undefined}>
            {`Next · ${next.name}`}
          </SectionTitle>
          {next.options.length > 1 && <p className="m-0 -mt-1 px-1 text-[15px]" style={{ color: T.ter }}>{next.options.length} options · pick any one</p>}
          <MealOptions key={next.id} options={next.options} foods={foods} level={level} recipeFor={recipeFor} pick={pickFor(next)} onPick={setPick(next)} />
          {ticks && <TickActions key={`a-${next.id}`} meal={next} optionIndex={pickFor(next)} date={date} onTick={onTick(next)} />}
        </>
      )}

      {allDone && (
        <Card>
          <p className="m-0 text-base font-semibold">Every meal logged today 🙌</p>
          <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>That’s what consistency looks like. See you at breakfast.</p>
        </Card>
      )}

      {meals.length > (next ? 1 : 0) && (
        <>
          <SectionTitle>Your day</SectionTitle>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
            {meals.map((m, i) => ({ m, i })).filter((x) => x.i !== nextIdx).map(({ m, i }, k) => {
              const isOpen = open === m.id
              const t = byMeal.get(m.id)
              const past = isPast(i)
              const sub = t
                ? [m.time, t.status === 'skipped' ? '' : t.option_title].filter(Boolean).join(' · ')
                : [m.time, `${m.options.length} option${m.options.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')
              return (
                <div key={m.id} style={{ borderTop: k === 0 ? undefined : `1px solid ${T.line}` }}>
                  <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-4 min-h-14 text-left">
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-semibold" style={{ color: t || past ? T.sec : T.ink }}>{m.name}</span>
                      {sub && <span className="block text-[13px] truncate" style={{ color: T.ter }}>{sub}</span>}
                    </span>
                    {t ? <StatusChip status={t.status} /> : past && ticks ? <StatusChip status="missing" /> : null}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 flex flex-col gap-2 gfm-page" style={{ background: '#F7F9FB' }}>
                      <div className="h-1" />
                      {t ? (
                        <TickedSummary tick={t} onUndo={() => undo(m.id)} />
                      ) : (
                        <>
                          <MealOptions options={m.options} foods={foods} level={level} recipeFor={recipeFor} pick={pickFor(m)} onPick={setPick(m)} />
                          {ticks && <TickActions meal={m} optionIndex={pickFor(m)} date={date} onTick={onTick(m)} />}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
