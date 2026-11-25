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
import { Icon, type IconName } from '@/components/ui/Icon'

const TOOLS: { href: string; icon: IconName; label: string; color: string }[] = [
  { href: '/coach/dashboard/daily', icon: 'clipboard', label: 'Daily check-ins', color: '#007A8A' },
  { href: '/coach/dashboard/workouts', icon: 'dumbbell', label: 'Workouts', color: '#4a7fd4' },
  { href: '/coach/dashboard/nutrition', icon: 'leaf', label: 'Nutrition', color: '#16A34A' },
  { href: '/plate', icon: 'plate', label: 'PEAK Plate', color: '#D97706' },
  { href: '/coach/dashboard/content', icon: 'book', label: 'Courses & audios', color: '#7C3AED' },
  { href: '/coach/dashboard/ideas', icon: 'bulb', label: 'PEAK Ideas', color: '#CA8A04' },
  { href: '/coach/dashboard/blueprint-calculator', icon: 'calculator', label: 'Blueprint calc', color: '#1a1f3a' },
]

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
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center px-6">
        <p className="text-base text-[#B91C1C] bg-[#FEF2F2] rounded-2xl px-4 py-3">Error: {error}</p>
      </div>
    )
  }

  const hour = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })
  const hideOnPhone = selected ? 'hidden md:flex' : 'flex'

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#0f172a]">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 flex flex-col gap-3 md:gap-4">

        {/* Header */}
        <div className={`${hideOnPhone} rounded-3xl bg-[#1a1f3a] p-5 md:px-6 items-center justify-between gap-x-4 gap-y-3 flex-wrap`}>
          <div className="flex items-center gap-4 min-w-0">
            <img src="/logo.png" alt="" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase text-[#00D4E8]">Coach dashboard<span className="hidden md:inline"> · {today}</span></p>
              <h1 className="m-0 mt-0.5 text-white text-[22px] md:text-[26px] leading-tight font-bold tracking-tight">{greeting}, Mohit.</h1>
            </div>
          </div>
          {atRisk > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#EF4444]/15 text-[#FCA5A5]">
              <Icon name="alert" size={16} />{atRisk} at risk
            </span>
          )}
        </div>

        {/* Tools */}
        <div className={`${hideOnPhone} gap-2 overflow-x-auto gfm-no-scrollbar -mx-3 px-3 md:mx-0 md:px-0 pb-1 md:grid md:grid-cols-7`}>
          {TOOLS.map((t) => (
            <button
              key={t.href}
              onClick={() => go(t.href)}
              className="flex-shrink-0 w-[5.75rem] md:w-auto flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center hover:shadow-md transition-shadow"
              style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}1A`, color: t.color }}>
                <Icon name={t.icon} size={21} />
              </span>
              <span className="text-[13px] font-semibold leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className={`${hideOnPhone} flex-col md:flex-row gap-2 md:gap-3`}>
          <div className="grid grid-cols-4 gap-2 md:flex-1">
            {[
              { label: 'Active', value: total, color: '#0f172a' },
              { label: 'On track', value: onTrack, color: '#16A34A' },
              { label: 'Attention', value: needsAttention, color: '#D97706' },
              { label: 'At risk', value: atRisk, color: '#DC2626' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl px-3 py-3 md:px-4" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
                <div className="text-[26px] leading-none font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="mt-1.5 text-[13px] font-medium text-[#64748b]">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-x-4 gap-y-2 flex-wrap md:flex-nowrap" style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}>
            {phaseCounts.map(({ phase, count, color }) => (
              <div key={phase} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[15px] font-bold">{count}</span>
                <span className="text-[13px] text-[#64748b]">{phase}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions ending soon */}
        <div className={`${selected ? 'hidden md:block' : ''} empty:hidden`}>
          <RenewalsPanel />
        </div>

        {/* Recorded calls: notes ready to review / calls to file */}
        <div className={`${selected ? 'hidden md:block' : ''} empty:hidden`}>
          <CallNotesInbox clients={clients} />
        </div>

        {/* Main split view. Phones show one pane at a time: the list, or the
            selected client full-screen with a back button. */}
        <div className="flex gap-4 items-start">

          <div
            className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col bg-white rounded-3xl overflow-hidden md:sticky md:top-4 md:h-[calc(100vh-2rem)]`}
            style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}
          >
            <div className="px-4 pt-4 pb-1 flex items-center gap-2">
              <Icon name="users" size={18} />
              <span className="text-[17px] font-bold">Clients</span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
            <ClientList
              clients={clients}
              selectedId={selected?.id || null}
              onSelect={(c) => { setSelected(c); window.scrollTo(0, 0) }}
              onStatusChange={setClientStatus}
            />
            </div>
          </div>

          <div
            className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col bg-white rounded-3xl overflow-hidden md:sticky md:top-4 md:h-[calc(100vh-2rem)]`}
            style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}
          >
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="md:hidden flex items-center gap-1 min-h-12 px-3 text-[17px] font-medium text-[#007A8A] border-b border-[#E5E7EB] bg-white sticky top-0 z-10"
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
    </div>
  )
}
