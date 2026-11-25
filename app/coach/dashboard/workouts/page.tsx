'use client'

import { CoachShell } from '@/components/layout/CoachShell'
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
    <CoachShell
      title="Workouts"
      subtitle="Build plans, reuse templates, manage the exercise library."
      tabs={[{ key: 'plans', label: 'Plans' }, { key: 'library', label: 'Exercise library' }]}
      activeTab={tab}
      onTab={(k) => {
        setTab(k as typeof tab)
        window.history.replaceState(null, '', k === 'library' ? '?tab=library' : window.location.pathname)
      }}
    >
      <div className="py-2">
        {tab === 'plans' ? <PlansList /> : <LibraryManager />}
      </div>
    </CoachShell>
  )
}
