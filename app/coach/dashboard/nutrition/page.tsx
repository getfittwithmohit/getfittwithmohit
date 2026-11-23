'use client'

import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { FoodLibrary } from '@/components/nutrition/coach/FoodLibrary'

// Nutrition (coach). Phase 1 step 1: the food library every plan is built from.
// Plans and templates arrive as the next tab.
export default function CoachNutritionPage() {
  const { checking } = useAuthGuard('coach')
  if (checking) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => (window.location.href = '/coach/dashboard')} className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1">
            ← Dashboard
          </button>
          <h1 className="text-white text-lg font-medium">Nutrition</h1>
          <p className="text-white/40 text-xs mt-0.5">Food library · values from IFCT 2017 (ICMR–NIN) and your own recipes</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <FoodLibrary />
      </div>
    </div>
  )
}
