'use client'

import Link from 'next/link'
import { Card, T } from '@/components/ui/ios'
import { Icon } from '@/components/ui/Icon'
import { describeItem, optionTotals, type Level, type PlanOption } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import type { RecipeLink } from './useNutrition'

const r0 = (n: number) => Math.round(n)
const dishName = (f: Food | undefined, slug: string) => (f?.name || slug).split(',')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim()

// "How to cook" for an option: one named button, or a list when the option
// has several dishes with recipes.
export function HowToCook({ option, foods, recipeFor }: { option: PlanOption; foods: Map<string, Food>; recipeFor: Map<string, RecipeLink> }) {
  const cook = [...new Set(option.items.map((it) => it.food))]
    .map((slug) => ({ slug, r: recipeFor.get(slug) }))
    .filter((x): x is { slug: string; r: RecipeLink } => !!x.r)
  if (cook.length === 0) return null
  if (cook.length === 1) {
    const { slug, r } = cook[0]
    return (
      <Link href={`/me/recipes/${r.id}`} className="mt-1 flex items-center justify-center gap-2 min-h-12 px-4 rounded-2xl text-[15px] font-bold text-center" style={{ background: T.cyan, color: T.navy }}>
        <Icon name="plate" size={18} />How to cook {dishName(foods.get(slug), slug).toLowerCase()} · {r.minutes} min
      </Link>
    )
  }
  return (
    <div className="mt-1 rounded-2xl overflow-hidden" style={{ background: '#E6F7F9' }}>
      <p className="m-0 px-4 pt-3 pb-1 text-xs font-bold tracking-[0.12em]" style={{ color: T.teal }}>HOW TO COOK</p>
      {cook.map(({ slug, r }) => (
        <Link key={r.id} href={`/me/recipes/${r.id}`} className="flex items-center gap-3 px-4 min-h-12 text-[15px] font-semibold" style={{ color: T.navy, borderTop: '1px solid rgba(0,122,138,0.12)' }}>
          <Icon name="plate" size={18} />
          <span className="flex-1">{dishName(foods.get(slug), slug)}</span>
          <span className="text-[13px] font-medium" style={{ color: T.teal }}>{r.minutes} min</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      ))}
    </div>
  )
}

// One plate option: title, items at the client's level, protein, why, how to cook.
export function OptionCard({ option, index, foods, level, recipeFor, compact = false }: {
  option: PlanOption; index: number; foods: Map<string, Food>; level: Level; recipeFor: Map<string, RecipeLink>; compact?: boolean
}) {
  const tot = optionTotals(option, foods)
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-base font-semibold leading-snug">
          <span className="block text-xs font-bold tracking-[0.08em] uppercase" style={{ color: T.teal }}>Option {index + 1}</span>
          <span className="block">{option.title}</span>
        </p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#F1F5F9', color: T.sec }}>
          {r0(tot.protein)} g protein{level === 3 ? ` · ${r0(tot.kcal)} kcal` : ''}
        </span>
      </div>
      <ul className="m-0 pl-5 list-disc flex flex-col gap-0.5 text-[15px]">
        {option.items.map((it, j) => <li key={j}>{describeItem(it, foods.get(it.food), level).replace(' · ', ' — ')}</li>)}
      </ul>
      {!compact && option.why && <p className="m-0 text-[15px] leading-snug" style={{ color: T.teal }}>{option.why}</p>}
      <HowToCook option={option} foods={foods} recipeFor={recipeFor} />
      {!compact && option.tip && <p className="m-0 text-sm" style={{ color: T.ter }}>Tip: {option.tip}</p>}
    </Card>
  )
}

export function BackToEat() {
  return (
    <Link href="/eat" className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Eat
    </Link>
  )
}
