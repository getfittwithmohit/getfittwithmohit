'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Card, LargeTitle, Screen, ScreenSkeleton, Skeleton, T } from '@/components/ui/ios'
import { Icon } from '@/components/ui/Icon'
import { getCached, setCached } from '@/lib/ui/cache'
import { normaliseFoods, PROTEIN_TINT, recipeFits } from '@/components/recipes/shared'
import { BackToEat } from '@/components/eat/OptionCard'
import { MEAL_TYPES, PROTEIN_LABEL, portionTotals, type MealType, type ProteinKey, type Recipe } from '@/lib/nutrition/recipes'
import type { Food } from '@/lib/nutrition/foods'

interface Book { recipes: Recipe[]; foods: Food[]; diet: string | null }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Client: the recipe book — every approved recipe that fits their diet.
export default function RecipeBookPage() {
  const { checking } = useAuthGuard()
  const [book, setBook] = useState<Book | null>(() => getCached<Book>('recipes') ?? null)
  const [failed, setFailed] = useState(false)
  const [protein, setProtein] = useState<ProteinKey | null>(null)
  const [meal, setMeal] = useState<MealType | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/recipes')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setBook(setCached('recipes', { recipes: d.recipes, foods: normaliseFoods(d.foods), diet: d.diet })) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const bySlug = useMemo(() => new Map((book?.foods || []).map((f) => [f.slug, f])), [book])
  const mine = useMemo(() => (book?.recipes || []).filter((r) => recipeFits(r, bySlug, book?.diet ?? null)), [book, bySlug])
  const proteins = useMemo(() => [...new Set(mine.map((r) => r.protein_key))], [mine])
  const shown = mine.filter((r) => (!protein || r.protein_key === protein) && (!meal || r.meal_types.includes(meal)))

  if (checking) return <ScreenSkeleton title="Recipes" blocks={[56, 96, 96, 96]} />

  const chip = (on: boolean) => ({ className: 'flex-shrink-0 min-h-9 px-3.5 rounded-full text-sm font-semibold transition-colors', style: on ? { background: T.navy, color: '#fff' } : { background: '#fff', color: '#334155' } })

  return (
    <Screen>
      <BackToEat />
      <LargeTitle eyebrow="Cook it your way" title="Recipes" />

      {!book && !failed && <><Skeleton h={44} /><Skeleton h={96} /><Skeleton h={96} /><Skeleton h={96} /></>}
      {failed && !book && <Card><p className="m-0 text-[15px]" style={{ color: T.sec }}>Couldn’t load recipes. Check your connection and try again.</p></Card>}

      {book && mine.length === 0 && (
        <Card>
          <p className="m-0 text-base font-semibold">Recipes are on their way</p>
          <p className="m-0 mt-1 text-[15px]" style={{ color: T.sec }}>Coach Mohit is adding recipes that fit your plan. They’ll show up here.</p>
        </Card>
      )}

      {mine.length > 0 && (
        <>
          <div className="flex gap-1.5 overflow-x-auto gfm-no-scrollbar -mx-4 px-4">
            <button onClick={() => setMeal(null)} {...chip(!meal)}>All meals</button>
            {MEAL_TYPES.filter((m) => mine.some((r) => r.meal_types.includes(m))).map((m) => (
              <button key={m} onClick={() => setMeal(meal === m ? null : m)} {...chip(meal === m)}>{cap(m)}</button>
            ))}
          </div>
          {proteins.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto gfm-no-scrollbar -mx-4 px-4 -mt-1">
              <button onClick={() => setProtein(null)} {...chip(!protein)}>Any protein</button>
              {proteins.map((p) => <button key={p} onClick={() => setProtein(protein === p ? null : p)} {...chip(protein === p)}>{PROTEIN_LABEL[p]}</button>)}
            </div>
          )}

          {shown.length === 0 && <p className="m-0 px-1 text-[15px]" style={{ color: T.ter }}>Nothing for that combination yet.</p>}

          {shown.map((r) => {
            const t = portionTotals(r.ingredients, bySlug)
            return (
              <Link key={r.id} href={`/me/recipes/${r.id}`} className="flex items-center gap-3.5 bg-white rounded-2xl p-3 pr-4" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
                <span className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: PROTEIN_TINT[r.protein_key] || '#F2F4F7', color: T.sec }}><Icon name="plate" size={26} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold leading-snug" style={{ color: T.ink }}>{r.title}</span>
                  <span className="block mt-0.5 text-[13px]" style={{ color: T.ter }}>{r.minutes} min · {Math.round(t.protein)} g protein · {r.meal_types.map(cap).join(', ')}</span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
              </Link>
            )
          })}
        </>
      )}
    </Screen>
  )
}
