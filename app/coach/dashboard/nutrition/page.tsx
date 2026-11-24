'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { FoodLibrary } from '@/components/nutrition/coach/FoodLibrary'
import { TemplatesTab } from '@/components/nutrition/coach/TemplatesTab'
import { go } from '@/lib/ui/navigate'

type Tab = 'templates' | 'foods'

// Nutrition (coach): plan templates and the food library every plan uses.
// Each client's own plan lives on their profile (Nutrition tab).
export default function CoachNutritionPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<Tab>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'foods' ? 'foods' : 'templates'
  )
  if (checking) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => (go('/coach/dashboard'))} className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1">
            ← Dashboard
          </button>
          <h1 className="text-white text-lg font-medium">Nutrition</h1>
          <p className="text-white/40 text-xs mt-0.5">Client plans live on each client’s profile → Nutrition</p>
        </div>
      </div>
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {([{ key: 'templates', label: '📋 Templates' }, { key: 'foods', label: '🥗 Food library' }] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); window.history.replaceState(null, '', t.key === 'foods' ? '?tab=foods' : window.location.pathname) }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-[#00D4E8] text-[#0f172a]' : 'border-transparent text-[#94a3b8] hover:text-[#64748b]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'foods' ? <FoodLibrary /> : <TemplatesTab />}
      </div>
    </div>
  )
}
