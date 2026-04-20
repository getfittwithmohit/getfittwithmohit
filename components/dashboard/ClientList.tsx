'use client'

import { useState } from 'react'
import { ClientSummary } from '@/hooks/useClients'

type Filter = 'all' | 'red' | 'amber' | 'green'

const PHASE_COLORS: Record<string, string> = {
  Adaptation: '#4a7fd4',
  Building: '#00d4d4',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
}

const PHASE_EMOJI: Record<string, string> = {
  Adaptation: '🌱',
  Building: '💪',
  Performance: '🔥',
  Maintenance: '🏆',
}

const RISK_COLORS: Record<string, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface ClientListProps {
  clients: ClientSummary[]
  selectedId: string | null
  onSelect: (client: ClientSummary) => void
}

export function ClientList({
  clients,
  selectedId,
  onSelect,
}: ClientListProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = clients.filter((c) => {
    if (filter === 'all') return true
    return c.risk_status === filter
  })

  const counts = {
    all: clients.length,
    red: clients.filter((c) => c.risk_status === 'red').length,
    amber: clients.filter((c) => c.risk_status === 'amber').length,
    green: clients.filter((c) => c.risk_status === 'green').length,
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `All ${counts.all}` },
    { key: 'red', label: `🔴 ${counts.red}` },
    { key: 'amber', label: `🟡 ${counts.amber}` },
    { key: 'green', label: `🟢 ${counts.green}` },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* Filter tabs */}
      <div className="flex gap-1 p-3 border-b border-[#e2e8f0]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex-1 py-1.5 px-2 rounded-lg text-xs font-medium
              transition-all duration-150
              ${filter === tab.key
                ? 'bg-[#1a1f3a] text-[#00d4d4]'
                : 'text-[#64748b] hover:bg-[#f8fafc]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Client rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-[#94a3b8] py-8">
            No clients in this category
          </div>
        )}
        {filtered.map((client) => {
          const phaseColor = PHASE_COLORS[client.phase] || '#64748b'
          const phaseEmoji = PHASE_EMOJI[client.phase] || ''
          const riskColor = RISK_COLORS[client.risk_status] || '#22c55e'
          const isSelected = client.id === selectedId

          return (
            <div
              key={client.id}
              onClick={() => onSelect(client)}
              className={`
                flex items-center gap-3 px-4 py-3
                border-b border-[#e2e8f0] cursor-pointer
                transition-all duration-150
                ${isSelected
                  ? 'bg-[#f0fdfd] border-l-2 border-l-[#00d4d4]'
                  : 'hover:bg-[#f8fafc]'
                }
              `}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  background: `${phaseColor}20`,
                  color: phaseColor,
                }}
              >
                {getInitials(client.full_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#0f172a] truncate">
                  {client.full_name}
                </div>
                <div className="text-xs text-[#94a3b8] mt-0.5">
                  Wk {client.current_week} · {phaseEmoji} {client.phase}
                </div>
              </div>

              {/* Risk dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: riskColor }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}