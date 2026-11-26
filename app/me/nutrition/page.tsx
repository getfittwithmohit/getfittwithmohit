'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { Card, LargeTitle, Screen, SectionTitle, Skeleton, T } from '@/components/ui/ios'
import { PLATE_RULES, type Level } from '@/lib/nutrition/plan'
import { useNutrition } from '@/components/eat/useNutrition'
import { BackToEat, OptionCard } from '@/components/eat/OptionCard'

const LEVEL_NAME: Record<Level, string> = { 1: 'Habits', 2: 'Portions', 3: 'Numbers' }

// Client: the nutrition plan Coach Mohit published, shown at the client's level.
// Lives under the Eat tab.
export default function MyNutritionPage() {
  const { checking } = useAuthGuard()
  const { data, failed, foods, recipeFor } = useNutrition()
  const [now] = useState(() => Date.now())
  const at = data?.plan?.published_at
  const recent = !!at && now - new Date(at).getTime() < 14 * 24 * 3600 * 1000

  if (checking) return <PageLoader />

  const plan = data?.plan
  const doc = plan?.doc
  const level = (doc?.level || 1) as Level

  return (
    <Screen>
      <BackToEat />
      <LargeTitle eyebrow="From Coach Mohit" title="Your plan & rules" />

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
              {m.options.map((o, i) => <OptionCard key={o.id} option={o} index={i} foods={foods} level={level} recipeFor={recipeFor} />)}
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
