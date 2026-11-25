'use client'

import { CoachShell } from '@/components/layout/CoachShell'
import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { FoodLibrary } from '@/components/nutrition/coach/FoodLibrary'
import { TemplatesTab } from '@/components/nutrition/coach/TemplatesTab'
import { RecipesTab } from '@/components/nutrition/coach/RecipesTab'

type Tab = 'templates' | 'recipes' | 'foods'

// Nutrition (coach): plan templates and the food library every plan uses.
// Each client's own plan lives on their profile (Nutrition tab).
export default function CoachNutritionPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<Tab>(() => {
    const t = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return t === 'foods' || t === 'recipes' ? t : 'templates'
  })
  if (checking) return <PageLoader />

  return (
    <CoachShell
      title="Nutrition"
      subtitle="Client plans live on each client’s profile → Nutrition."
      tabs={[{ key: 'templates', label: 'Templates' }, { key: 'recipes', label: 'Recipes' }, { key: 'foods', label: 'Food library' }]}
      activeTab={tab}
      onTab={(k) => { setTab(k as typeof tab); window.history.replaceState(null, '', k === 'templates' ? window.location.pathname : `?tab=${k}`) }}
    >
      <div className="py-2">
        {tab === 'foods' ? <FoodLibrary /> : tab === 'recipes' ? <RecipesTab /> : <TemplatesTab />}
      </div>
    </CoachShell>
  )
}
