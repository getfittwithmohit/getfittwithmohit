'use client'

import { useState, useEffect, useRef } from 'react'
import { ClientSummary } from '@/hooks/useClients'

type Filter = 'active' | 'red' | 'amber' | 'green' | 'paused' | 'inactive'

const PHASE_COLORS: Record<string, string> = {
  Onboarding: '#f59e0b',
  Adaptation: '#4a7fd4',
  Building: '#00d4d4',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
}

const PHASE_EMOJI: Record<string, string> = {
  Onboarding: '📋',
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

const CALL_STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  completed: { emoji: '✅', label: 'done', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  missed: { emoji: '❌', label: 'missed', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  rescheduled: { emoji: '🔄', label: 'rescheduled', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  pending: { emoji: '📞', label: 'pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
}

const ACCOUNT_STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  active: { emoji: '🟢', label: 'Active', color: '#16a34a', bg: '#f0fdf4' },
  paused: { emoji: '⏸️', label: 'Paused', color: '#d97706', bg: '#fffbeb' },
  inactive: { emoji: '⚪', label: 'Inactive', color: '#6b7280', bg: '#f3f4f6' },
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
  onStatusChange: (id: string, status: 'active' | 'paused' | 'inactive') => Promise<void>
}

export function ClientList({
  clients,
  selectedId,
  onSelect,
  onStatusChange,
}: ClientListProps) {
  const [filter, setFilter] = useState<Filter>('active')
  const [currentMap, setCurrentMap] = useState<Record<string, any>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)
  const [form, setForm] = useState({
    status: 'completed' as 'completed' | 'missed' | 'rescheduled',
    discussed: '',
    changes: '',
    next_focus: '',
  })

  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const loadCurrent = () => {
    fetch('/api/review-calls/current-status')
      .then((res) => res.json())
      .then((data) => setCurrentMap(data.current || {}))
      .catch((err) => console.error('Failed to load call status:', err))
  }

  useEffect(() => {
    loadCurrent()
  }, [])

  // Close status menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = clients.filter((c) => {
    const status = c.status || 'active'
    if (filter === 'active') return status === 'active'
    if (filter === 'paused') return status === 'paused'
    if (filter === 'inactive') return status === 'inactive'
    // red/amber/green — only among active clients
    return status === 'active' && c.risk_status === filter
  })

  const activeClients = clients.filter((c) => (c.status || 'active') === 'active')

  const counts = {
    active: activeClients.length,
    red: activeClients.filter((c) => c.risk_status === 'red').length,
    amber: activeClients.filter((c) => c.risk_status === 'amber').length,
    green: activeClients.filter((c) => c.risk_status === 'green').length,
    paused: clients.filter((c) => c.status === 'paused').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'active', label: `Active ${counts.active}` },
    { key: 'red', label: `🔴 ${counts.red}` },
    { key: 'amber', label: `🟡 ${counts.amber}` },
    { key: 'green', label: `🟢 ${counts.green}` },
    { key: 'paused', label: `⏸️ ${counts.paused}` },
    { key: 'inactive', label: `⚪ ${counts.inactive}` },
  ]

  const toggleExpand = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStatusMenuId(null)
    if (expandedId === clientId) {
      setExpandedId(null)
      return
    }
    setExpandedId(clientId)
    const existing = currentMap[clientId]
    setForm({
      status: existing?.status === 'pending' ? 'completed' : (existing?.status || 'completed'),
      discussed: existing?.discussed || '',
      changes: existing?.changes || '',
      next_focus: existing?.next_focus || '',
    })
  }

  const handleMark = async (clientId: string, weekNumber: number) => {
    setMarking(true)
    try {
      await fetch('/api/review-calls/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          weekNumber,
          status: form.status,
          discussed: form.discussed || null,
          changes: form.changes || null,
          next_focus: form.next_focus || null,
        }),
      })
      setExpandedId(null)
      loadCurrent()
    } catch (err) {
      console.error('Mark error:', err)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setMarking(false)
    }
  }

  const toggleStatusMenu = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedId(null)
    setStatusMenuId(statusMenuId === clientId ? null : clientId)
  }

  const handleStatusChange = async (
    clientId: string,
    status: 'active' | 'paused' | 'inactive'
  ) => {
    setUpdatingStatus(true)
    try {
      await onStatusChange(clientId, status)
      setStatusMenuId(null)
    } catch (err) {
      console.error('Status update error:', err)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 p-3 border-b border-[#e2e8f0]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              py-1.5 px-2.5 rounded-lg text-xs font-medium
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
          const current = currentMap[client.id]
          const isExpanded = expandedId === client.id
          const isStatusMenuOpen = statusMenuId === client.id
          const callStatusCfg = current ? CALL_STATUS_CONFIG[current.status] || CALL_STATUS_CONFIG.pending : null
          const accountStatus = client.status || 'active'
          const accountCfg = ACCOUNT_STATUS_CONFIG[accountStatus]

          return (
            <div key={client.id} className="border-b border-[#e2e8f0] relative">
              <div
                onClick={() => onSelect(client)}
                className={`
                  flex items-center gap-3 px-4 py-3
                  cursor-pointer
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

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {accountStatus !== 'active' && (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: accountCfg.bg, color: accountCfg.color }}
                      >
                        {accountCfg.emoji} {accountCfg.label}
                      </span>
                    )}
                    {accountStatus === 'active' && current && callStatusCfg && (
                      <button
                        onClick={(e) => toggleExpand(client.id, e)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors"
                        style={{
                          background: callStatusCfg.bg,
                          color: callStatusCfg.color,
                          borderColor: callStatusCfg.border,
                        }}
                      >
                        {callStatusCfg.emoji} Week {current.week} {callStatusCfg.label}
                      </button>
                    )}
                  </div>
                </div>

                {/* Risk dot + status menu trigger */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {accountStatus === 'active' && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: riskColor }}
                    />
                  )}
                  <button
                    onClick={(e) => toggleStatusMenu(client.id, e)}
                    className="text-[#94a3b8] hover:text-[#64748b] text-sm leading-none px-1 transition-colors"
                    title="Change account status"
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {/* Status change dropdown */}
              {isStatusMenuOpen && (
                <div
                  ref={statusMenuRef}
                  className="absolute right-4 top-12 z-20 bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden w-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(['active', 'paused', 'inactive'] as const).map((s) => {
                    const cfg = ACCOUNT_STATUS_CONFIG[s]
                    const isCurrent = accountStatus === s
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(client.id, s)}
                        disabled={updatingStatus || isCurrent}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors ${
                          isCurrent ? 'bg-[#f8fafc]' : 'hover:bg-[#f8fafc]'
                        } disabled:cursor-default`}
                      >
                        <span>{cfg.emoji}</span>
                        <span style={{ color: isCurrent ? cfg.color : '#0f172a' }}>
                          {cfg.label}
                        </span>
                        {isCurrent && <span className="ml-auto text-[#00d4d4]">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Quick-mark call panel */}
              {isExpanded && current && (
                <div
                  className="px-4 pb-4 bg-[#fafbfc] border-t border-[#e2e8f0]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mt-3 mb-2">
                    Week {current.week} review call
                  </p>

                  <div className="flex gap-2 mb-3">
                    {[
                      { value: 'completed', label: '✅ Completed' },
                      { value: 'missed', label: '❌ Missed' },
                      { value: 'rescheduled', label: '🔄 Rescheduled' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((p) => ({ ...p, status: opt.value as any }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.status === opt.value
                            ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#1a1f3a]'
                            : 'bg-white text-[#64748b] border-[#e2e8f0]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {form.status === 'completed' && (
                    <div className="flex flex-col gap-2 mb-3">
                      <textarea
                        value={form.discussed}
                        onChange={(e) => setForm((p) => ({ ...p, discussed: e.target.value }))}
                        placeholder="What we discussed..."
                        rows={2}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                      />
                      <textarea
                        value={form.changes}
                        onChange={(e) => setForm((p) => ({ ...p, changes: e.target.value }))}
                        placeholder="What we're changing..."
                        rows={2}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                      />
                      <textarea
                        value={form.next_focus}
                        onChange={(e) => setForm((p) => ({ ...p, next_focus: e.target.value }))}
                        placeholder="Next week's focus..."
                        rows={2}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00d4d4] resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMark(client.id, current.week)}
                      disabled={marking}
                      className="flex-1 bg-[#1a1f3a] text-[#00d4d4] py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {marking ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] border border-[#e2e8f0]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}