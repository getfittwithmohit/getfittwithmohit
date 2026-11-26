'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCached, setCached } from '@/lib/ui/cache'
import type { Food } from '@/lib/nutrition/foods'
import type { PlanDoc } from '@/lib/nutrition/plan'

export interface RecipeLink { id: string; title: string; dish_food: string; minutes: number }
export interface NutritionPayload {
  recipes?: RecipeLink[]
  plan: { name: string; doc: PlanDoc; version: number; published_at: string | null; change_note: string | null } | null
  foods: Food[]
}

// The client's published plan, foods and plate recipes (/api/me/nutrition),
// cached across tab switches.
export function useNutrition() {
  const [data, setData] = useState<NutritionPayload | null>(() => getCached<NutritionPayload>('nutrition') ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/nutrition')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: NutritionPayload) => { if (!cancelled) setData(setCached('nutrition', d)) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const foods = useMemo(
    () => new Map((data?.foods || []).map((f) => [f.slug, { ...f, kcal: +f.kcal, protein_g: +f.protein_g, carbs_g: +f.carbs_g, fat_g: +f.fat_g, fibre_g: +f.fibre_g } as Food])),
    [data],
  )
  const recipeFor = useMemo(() => {
    const m = new Map<string, RecipeLink>()
    for (const r of data?.recipes || []) if (!m.has(r.dish_food)) m.set(r.dish_food, r)
    return m
  }, [data])

  return { data, failed, foods, recipeFor }
}
