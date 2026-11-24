'use client'

import { useState } from 'react'
import { RenewalsPanel } from '@/components/dashboard/RenewalsPanel'
import { CallNotesInbox } from '@/components/dashboard/CallNotesInbox'
import { useClients, ClientSummary } from '@/hooks/useClients'
import { ClientList } from '@/components/dashboard/ClientList'
import { DetailPanel } from '@/components/dashboard/DetailPanel'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { go } from '@/lib/ui/navigate'

const PHASE_COLORS: Record<string, string> = {
  Onboarding: '#f59e0b',
  Adaptation: '#4a7fd4',
  Building: '#00D4E8',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
}

export default function DashboardPage() {

  const { checking } = useAuthGuard('coach')

  const { clients, loading, error, flagClient, saveNotes, setClientStatus } = useClients()
  const [selected, setSelected] = useState<ClientSummary | null>(null)

  if (checking) return <PageLoader />

  // Summary counts
  const activeClients = clients.filter((c) => (c.status || 'active') === 'active')

  const total = activeClients.length
  const onTrack = activeClients.filter((c) => c.risk_status === 'green').length
  const needsAttention = activeClients.filter((c) => c.risk_status === 'amber').length
  const atRisk = activeClients.filter((c) => c.risk_status === 'red').length

  const phaseCounts = ['Onboarding', 'Adaptation', 'Building', 'Performance', 'Maintenance'].map(
    (phase) => ({
      phase,
      count: activeClients.filter((c) => c.phase === phase).length,
      color: PHASE_COLORS[phase],
    })
  )

  if (loading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-sm text-[#ef4444]">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">

      {/* Top bar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} bg-[#1a1f3a] px-4 md:px-6 py-4 flex-col md:flex-row md:items-center md:justify-between gap-3 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="GetFittWithMohit"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-white text-sm font-medium tracking-wide">
                GetFittWithMohit
              </h1>
              <p className="text-white/40 text-xs">Coach Dashboard</p>
            </div>
          </div>
          {atRisk > 0 && (
            <div className="md:hidden bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
              ⚠ {atRisk} At-Risk
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-3">
          {[
            { href: '/coach/dashboard/ideas', icon: '💡', label: 'PEAK Ideas' },
            { href: '/coach/dashboard/workouts', icon: '🏋️', label: 'Workouts' },
            { href: '/coach/dashboard/nutrition', icon: '🥗', label: 'Nutrition' },
            { href: '/coach/dashboard/daily', icon: '📋', label: 'Daily Check-ins' },
            { href: '/coach/dashboard/content', icon: '📚', label: 'Courses & Audios' },
            { href: '/plate', icon: '🍽️', label: 'PEAK Plate' },
            { href: '/coach/dashboard/blueprint-calculator', icon: '🧮', label: 'Blueprint Calculator' },
          ].map(item => (
            <button
              key={item.href}
              onClick={() => go(item.href)}
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 text-center text-white/60 hover:text-white text-[11px] md:text-xs font-medium leading-tight px-2 py-2 md:px-3 md:py-1.5 rounded-xl md:rounded-full border border-white/10 hover:border-white/20 transition-colors md:whitespace-nowrap"
            >
              <span className="text-base md:text-xs">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {atRisk > 0 && (
            <div className="hidden md:block bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
              ⚠ {atRisk} At-Risk
            </div>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} bg-white border-b border-[#e2e8f0] px-4 md:px-6 py-3 items-center gap-6 flex-shrink-0 overflow-x-auto`}>
        <div className="text-center flex-shrink-0">
          <div className="text-lg font-medium text-[#0f172a]">{total}</div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-wide">Total</div>
        </div>
        <div className="w-px h-8 bg-[#e2e8f0]" />
        <div className="text-center flex-shrink-0">
          <div className="text-lg font-medium text-[#22c55e]">{onTrack}</div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-wide">On Track</div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="text-lg font-medium text-[#f59e0b]">{needsAttention}</div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-wide">Attention</div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="text-lg font-medium text-[#ef4444]">{atRisk}</div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-wide">At Risk</div>
        </div>
        <div className="w-px h-8 bg-[#e2e8f0]" />
        {phaseCounts.map(({ phase, count, color }) => (
          <div key={phase} className="text-center flex-shrink-0">
            <div className="text-lg font-medium" style={{ color }}>
              {count}
            </div>
            <div className="text-xs text-[#94a3b8] uppercase tracking-wide">
              {phase.slice(0, 5)}
            </div>
          </div>
        ))}
      </div>

      {/* Subscriptions ending soon */}
      <div className={selected ? 'hidden md:block' : undefined}>
        <RenewalsPanel />
      </div>

      {/* Recorded calls: notes ready to review / calls to file */}
      <div className={selected ? 'hidden md:block' : undefined}>
        <CallNotesInbox clients={clients} />
      </div>

      {/* Main split view. Phones show one pane at a time: the list, or the
          selected client full-screen with a back button. */}
      <div className="flex flex-1 md:overflow-hidden">

        <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-shrink-0 md:border-r border-[#e2e8f0] bg-white md:overflow-hidden flex-col`}>
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
              Clients
            </span>
          </div>
          <ClientList
            clients={clients}
            selectedId={selected?.id || null}
            onSelect={(c) => { setSelected(c); window.scrollTo(0, 0) }}
            onStatusChange={setClientStatus}
          />
        </div>

        <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col bg-white md:overflow-hidden`}>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="md:hidden flex items-center gap-1 min-h-12 px-3 text-[17px] font-medium text-[#007A8A] border-b border-[#e2e8f0] bg-white sticky top-0 z-10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              All clients
            </button>
          )}
          <div className="flex-1 min-h-0">
            <DetailPanel
              client={selected}
              onFlag={flagClient}
              onSaveNotes={saveNotes}
            />
          </div>
        </div>

      </div>
    </div>
  )
}