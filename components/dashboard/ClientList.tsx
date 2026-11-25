'use client'

import { toast } from '@/lib/ui/feedback'
import { useState, useEffect, useRef } from 'react'
import { ClientSummary } from '@/hooks/useClients'
import { Icon } from '@/components/ui/Icon'

type Filter = 'active' | 'red' | 'amber' | 'green' | 'paused' | 'inactive'

const PHASE_COLORS: Record<string, string> = {
  Onboarding: '#f59e0b',
  Adaptation: '#4a7fd4',
  Building: '#00D4E8',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
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

  const tabs: { key: Filter; label: string; dot?: string; count: number }[] = [
    { key: 'active', label: 'All', count: counts.active },
    { key: 'red', label: 'Risk', dot: '#EF4444', count: counts.red },
    { key: 'amber', label: 'Watch', dot: '#F59E0B', count: counts.amber },
    { key: 'green', label: 'On track', dot: '#22C55E', count: counts.green },
    { key: 'paused', label: 'Paused', dot: '#D97706', count: counts.paused },
    { key: 'inactive', label: 'Inactive', dot: '#94A3B8', count: counts.inactive },
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
      toast('Something went wrong. Please try again.')
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
      toast('Something went wrong. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 py-3 overflow-x-auto flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex-shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full text-[13px] font-semibold whitespace-nowrap
              transition-colors duration-150
              ${filter === tab.key
                ? 'bg-[#1a1f3a] text-white'
                : 'bg-[#F2F4F7] text-[#475569] hover:bg-[#E8ECF1]'
              }
            `}
          >
            {tab.dot && <span className="w-2 h-2 rounded-full" style={{ background: tab.dot }} />}
            {tab.label}
            <span className={filter === tab.key ? 'text-white/60' : 'text-[#94a3b8]'}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Client rows */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && (
          <div className="text-center text-[15px] text-[#94a3b8] py-10">
            No clients in this category
          </div>
        )}
        {filtered.map((client) => {
          const phaseColor = PHASE_COLORS[client.phase] || '#64748b'
          const riskColor = RISK_COLORS[client.risk_status] || '#22c55e'
          const isSelected = client.id === selectedId
          const current = currentMap[client.id]
          const isExpanded = expandedId === client.id
          const isStatusMenuOpen = statusMenuId === client.id
          const callStatusCfg = current ? CALL_STATUS_CONFIG[current.status] || CALL_STATUS_CONFIG.pending : null
          const accountStatus = client.status || 'active'
          const accountCfg = ACCOUNT_STATUS_CONFIG[accountStatus]

          return (
            <div key={client.id} className="relative">
              <div
                onClick={() => onSelect(client)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-2xl
                  cursor-pointer
                  transition-colors duration-150
                  ${isSelected
                    ? 'bg-[#E6F7F9]'
                    : 'hover:bg-[#F7F9FB]'
                  }
                `}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: `${phaseColor}20`,
                    color: phaseColor,
                  }}
                >
                  {getInitials(client.full_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-[#0f172a] truncate">
                    {client.full_name}
                  </div>
                  <div className="text-[13px] text-[#64748b] mt-0.5">
                    Week {client.current_week} · {client.phase}
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
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors"
                        style={{
                          background: callStatusCfg.bg,
                          color: callStatusCfg.color,
                          borderColor: callStatusCfg.border,
                        }}
                      >
                        Week {current.week} {callStatusCfg.label}
                      </button>
                    )}
                  </div>
                </div>

                {/* Risk dot + status menu trigger */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {accountStatus === 'active' && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: riskColor }}
                    />
                  )}
                  <button
                    onClick={(e) => toggleStatusMenu(client.id, e)}
                    className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-[#F2F4F7] hover:text-[#475569] transition-colors"
                    title="Change account status"
                    aria-label="Change account status"
                  >
                    <Icon name="more" size={18} />
                  </button>
                </div>
              </div>

              {/* Status change dropdown */}
              {isStatusMenuOpen && (
                <div
                  ref={statusMenuRef}
                  className="gfm-pop absolute right-2 top-12 z-20 bg-white rounded-2xl overflow-hidden w-44 p-1" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.05)' }}
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
                        className={`w-full flex items-center gap-2 px-3 min-h-11 rounded-xl text-[15px] text-left transition-colors ${
                          isCurrent ? 'bg-[#F7F9FB]' : 'hover:bg-[#F2F4F7]'
                        } disabled:cursor-default`}
                      >
                        <span>{cfg.emoji}</span>
                        <span style={{ color: isCurrent ? cfg.color : '#0f172a' }}>
                          {cfg.label}
                        </span>
                        {isCurrent && <span className="ml-auto text-[#007A8A]"><Icon name="check" size={16} /></span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Quick-mark call panel */}
              {isExpanded && current && (
                <div
                  className="mx-1 mb-2 px-3 pb-3 bg-[#F7F9FB] rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-[#475569] uppercase tracking-[0.12em] pt-3 mb-2">
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
                        className={`flex-1 min-h-10 rounded-xl text-[13px] font-semibold transition-colors ${
                          form.status === opt.value
                            ? 'bg-[#1a1f3a] text-[#00D4E8]'
                            : 'bg-white text-[#475569]'
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
                        className="w-full px-3 py-2.5 bg-white border border-transparent rounded-xl text-[15px] focus:outline-none focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 resize-none"
                      />
                      <textarea
                        value={form.changes}
                        onChange={(e) => setForm((p) => ({ ...p, changes: e.target.value }))}
                        placeholder="What we're changing..."
                        rows={2}
                        className="w-full px-3 py-2.5 bg-white border border-transparent rounded-xl text-[15px] focus:outline-none focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 resize-none"
                      />
                      <textarea
                        value={form.next_focus}
                        onChange={(e) => setForm((p) => ({ ...p, next_focus: e.target.value }))}
                        placeholder="Next week's focus..."
                        rows={2}
                        className="w-full px-3 py-2.5 bg-white border border-transparent rounded-xl text-[15px] focus:outline-none focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMark(client.id, current.week)}
                      disabled={marking}
                      className="flex-1 bg-[#00D4E8] text-[#1a1f3a] min-h-11 rounded-xl text-[15px] font-bold disabled:opacity-50"
                    >
                      {marking ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-4 min-h-11 rounded-xl text-[15px] text-[#475569] bg-white"
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