'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { PlansList } from '@/components/workouts/coach/PlansList'
import { LibraryManager } from '@/components/workouts/coach/LibraryManager'

type Tab = 'plans' | 'library'

export default function CoachWorkoutsPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<Tab>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'library' ? 'library' : 'plans'
  )

  if (checking) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => window.location.href = '/coach/dashboard'}
            className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-white text-lg font-medium">Workouts</h1>
        </div>
      </div>

      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {([
            { key: 'plans', label: '📋 Plans' },
            { key: 'library', label: '🏋️ Exercise library' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key)
                window.history.replaceState(null, '', t.key === 'library' ? '?tab=library' : window.location.pathname)
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-[#00D4E8] text-[#0f172a]' : 'border-transparent text-[#94a3b8] hover:text-[#64748b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'plans' ? <PlansList /> : <LibraryManager />}
      </div>
    </div>
  )
}
