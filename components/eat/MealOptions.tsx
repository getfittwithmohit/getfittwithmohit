'use client'

import { useState } from 'react'
import { T } from '@/components/ui/ios'
import { OptionCard } from '@/components/eat/OptionCard'
import type { RecipeLink } from '@/components/eat/useNutrition'
import type { Food } from '@/lib/nutrition/foods'
import type { Level, PlanOption } from '@/lib/nutrition/plan'

// "Paneer bhurji + 2 phulka" → "Paneer bhurji"
export function shortTitle(title: string) {
  const s = title.split(/\s*[+,(/]\s*|\s+with\s+/i)[0].trim() || title
  return s.length > 22 ? s.slice(0, 21).trimEnd() + '…' : s
}

// A meal's options as small tabs with one card open, so the day fits on a screen
export function MealOptions({ options, foods, level, recipeFor }: {
  options: PlanOption[]; foods: Map<string, Food>; level: Level; recipeFor: Map<string, RecipeLink>
}) {
  const [pick, setPick] = useState(0)
  const i = Math.min(pick, options.length - 1)
  if (!options.length) return null
  if (options.length === 1) return <OptionCard option={options[0]} index={0} foods={foods} level={level} recipeFor={recipeFor} compact />
  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" aria-label="Options" className="flex gap-2 overflow-x-auto gfm-no-scrollbar -mx-1 px-1">
        {options.map((o, j) => {
          const on = j === i
          return (
            <button key={o.id} role="tab" aria-selected={on} onClick={() => setPick(j)}
              className="min-h-10 px-3.5 rounded-full text-[15px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
              style={on ? { background: T.navy, color: '#fff' } : { background: '#fff', color: T.sec, boxShadow: '0 0 0 1px rgba(15,23,42,0.08)' }}>
              {shortTitle(o.title)}
            </button>
          )
        })}
      </div>
      <div key={options[i].id} className="gfm-page">
        <OptionCard option={options[i]} index={i} foods={foods} level={level} recipeFor={recipeFor} compact />
      </div>
    </div>
  )
}
