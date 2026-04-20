'use client'

import { useState } from 'react'
import { useClients, ClientSummary } from '@/hooks/useClients'
import { ClientList } from '@/components/dashboard/ClientList'
import { DetailPanel } from '@/components/dashboard/DetailPanel'

const PHASE_COLORS: Record<string, string> = {
  Adaptation: '#4a7fd4',
  Building: '#00d4d4',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
}

export default function DashboardPage() {
  const { clients, loading, error, flagClient, saveNotes } = useClients()
  const [selected, setSelected] = useState<ClientSummary | null>(null)

  // Summary counts
  const total = clients.length
  const onTrack = clients.filter((c) => c.risk_status === 'green').length
  const needsAttention = clients.filter((c) => c.risk_status === 'amber').length
  const atRisk = clients.filter((c) => c.risk_status === 'red').length

  const phaseCounts = ['Adaptation', 'Building', 'Performance', 'Maintenance'].map(
    (phase) => ({
      phase,
      count: clients.filter((c) => c.phase === phase).length,
      color: PHASE_COLORS[phase],
    })
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00d4d4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">Loading clients...</p>
        </div>
      </div>
    )
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
      <div className="bg-[#1a1f3a] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00d4d4] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 32 32" width="20" height="20">
              <line x1="6" y1="16" x2="26" y2="16" stroke="#1a1f3a" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="9" cy="16" r="3" fill="#1a1f3a"/>
              <circle cx="23" cy="16" r="3" fill="#1a1f3a"/>
              <rect x="13" y="14" width="6" height="4" rx="2" fill="#1a1f3a"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white text-sm font-medium tracking-wide">
              GetFittWithMohit
            </h1>
            <p className="text-white/40 text-xs">Coach Dashboard</p>
          </div>
        </div>

        {/* At-risk badge */}
        {atRisk > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
            ⚠ {atRisk} At-Risk
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-3 flex items-center gap-6 flex-shrink-0 overflow-x-auto">
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
            <div
              className="text-lg font-medium"
              style={{ color }}
            >
              {count}
            </div>
            <div className="text-xs text-[#94a3b8] uppercase tracking-wide">
              {phase.slice(0, 5)}
            </div>
          </div>
        ))}
      </div>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — client list */}
        <div className="w-72 flex-shrink-0 border-r border-[#e2e8f0] bg-white overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
              Clients
            </span>
          </div>
          <ClientList
            clients={clients}
            selectedId={selected?.id || null}
            onSelect={setSelected}
          />
        </div>

        {/* Right — detail panel */}
        <div className="flex-1 bg-white overflow-hidden">
          <DetailPanel
            client={selected}
            onFlag={flagClient}
            onSaveNotes={saveNotes}
          />
        </div>

      </div>
    </div>
  )
}