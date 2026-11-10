'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { CourseManager } from '@/components/content/CourseManager'
import { AudioManager } from '@/components/content/AudioManager'

const TABS = [
  { key: 'courses', label: '🎓 Courses' },
  { key: 'audios', label: '🎧 Audios' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function CoachContentPage() {
  const { checking } = useAuthGuard('coach')
  const [tab, setTab] = useState<TabKey>('courses')

  if (checking) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => window.location.href = '/coach/dashboard'}
              className="text-white/40 hover:text-white/70 text-xs transition-colors mb-1"
            >
              ← Dashboard
            </button>
            <h1 className="text-white text-lg font-medium">Courses &amp; Audios</h1>
            <p className="text-white/40 text-xs mt-0.5">Everything you publish here is visible to all active clients</p>
          </div>
          <img src="/logo.png" alt="GetFittWithMohit" className="w-10 h-10 object-contain" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#00d4d4] text-[#0f172a]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#64748b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'courses' ? <CourseManager /> : <AudioManager />}
      </div>
    </div>
  )
}
