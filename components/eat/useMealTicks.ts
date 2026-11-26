'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getCached, setCached } from '@/lib/ui/cache'
import { haptic } from '@/lib/ui/feel'
import { toast } from '@/lib/ui/feedback'
import { optionTotals, type PlanMeal } from '@/lib/nutrition/plan'
import type { Food } from '@/lib/nutrition/foods'
import type { MealTick, TickStatus } from '@/lib/nutrition/ticks'
import { todayIST } from '@/lib/utils/istDate'

// Today's meal ticks with instant (optimistic) ticking and undo.
export function useMealTicks(foods: Map<string, Food>) {
  const [date] = useState(() => todayIST())
  const key = `ticks:${date}`
  const [ticks, setTicks] = useState<MealTick[] | null>(() => getCached<MealTick[]>(key) ?? null)
  const latest = useRef(ticks)
  const save = useCallback((next: MealTick[]) => { latest.current = next; setTicks(setCached(key, next)) }, [key])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/me/meals?date=${date}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { ticks: MealTick[] }) => { if (!cancelled) save(d.ticks) })
      .catch(() => { if (!cancelled && !latest.current) save([]) })
    return () => { cancelled = true }
  }, [date, save])

  const tick = useCallback(async (meal: PlanMeal, status: TickStatus, optionIndex = 0) => {
    const before = latest.current || []
    const option = status === 'ate' ? meal.options[optionIndex] : undefined
    const t = option ? optionTotals(option, foods) : null
    const guess: MealTick = {
      tick_date: date, meal_id: meal.id, meal_name: meal.name, status,
      option_id: option?.id ?? null, option_title: option?.title ?? null,
      protein_g: t ? Math.round(t.protein * 10) / 10 : null, kcal: t ? Math.round(t.kcal) : null, plate_log_id: null,
    }
    save([...before.filter((x) => x.meal_id !== meal.id), guess])
    haptic(status === 'ate' ? 'success' : 'tap')
    try {
      const res = await fetch('/api/me/meals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, meal_id: meal.id, status, option_id: option?.id ?? null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not save')
      save([...(latest.current || []).filter((x) => x.meal_id !== meal.id), d.tick])
    } catch (e) {
      save(before)
      toast((e as Error).message || 'Could not save. Check your connection.')
    }
  }, [date, foods, save])

  const undo = useCallback(async (mealId: string) => {
    const before = latest.current || []
    save(before.filter((x) => x.meal_id !== mealId))
    haptic()
    const res = await fetch(`/api/me/meals?date=${date}&meal_id=${encodeURIComponent(mealId)}`, { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) { save(before); toast('Could not undo. Check your connection.') }
  }, [date, save])

  return { date, ticks, tick, undo }
}
