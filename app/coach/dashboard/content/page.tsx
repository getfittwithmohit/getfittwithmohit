'use client'

import { CoachShell } from '@/components/layout/CoachShell'
import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { CourseManager } from '@/components/content/CourseManager'
import { AudioManager } from '@/components/content/AudioManager'

const TABS = [
  { key: 'courses', label: 'Courses' },
  { key: 'audios', label: 'Audios' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function CoachContentPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<TabKey>('courses')

  if (checking) return <PageLoader />

  return (
    <CoachShell
      title="Courses & audios"
      subtitle="Everything you publish here is visible to all active clients."
      tabs={TABS}
      activeTab={tab}
      onTab={(k) => setTab(k as typeof tab)}
      width="max-w-3xl"
    >
      <div className="py-2">
        {tab === 'courses' ? <CourseManager /> : <AudioManager />}
      </div>
    </CoachShell>
  )
}
