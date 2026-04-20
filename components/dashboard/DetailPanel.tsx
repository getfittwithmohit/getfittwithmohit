'use client'

import { useState, useEffect } from 'react'
import { ClientSummary } from '@/hooks/useClients'
import { StatCard } from './StatCard'
import { AlertBanner } from './AlertBanner'
import { ProgressBars } from './ProgressBars'
import { QuickActions } from './QuickActions'
import { getRetentionAlert as calcAlert } from '@/lib/supabase/queries/clients'

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface DetailPanelProps {
  client: ClientSummary | null
  onFlag: (id: string, risk: 'green' | 'amber' | 'red') => void
  onSaveNotes: (id: string, notes: string) => void
}

export function DetailPanel({
  client,
  onFlag,
  onSaveNotes,
}: DetailPanelProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setNotes(client.coach_notes || '')
    }
  }, [client?.id])

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-4xl mb-3 opacity-20">👈</div>
        <p className="text-sm text-[#94a3b8]">
          Select a client to view their full profile
        </p>
      </div>
    )
  }

  const phaseColor = PHASE_COLORS[client.phase] || '#64748b'
  const phaseEmoji = PHASE_EMOJI[client.phase] || ''
const alertInfo = calcAlert(
    client.current_week,
    null,
    client.risk_status
  )

  const weightLost = client.starting_weight && client.current_weight
    ? (client.starting_weight - client.current_weight).toFixed(1)
    : '–'

  const handleSaveNotes = async () => {
    setSaving(true)
    await onSaveNotes(client.id, notes)
    setSaving(false)
  }

  const handleReengage = () => {
    alert(`Re-engagement triggered for ${client.full_name}.\n\nIn production: WhatsApp message sent with their Identity Card.`)
  }

  const handleViewProfile = () => {
    alert(`Viewing full profile for ${client.full_name}.\n\nFull profile view — coming in next build.`)
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">

      {/* Top — name + phase */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-base font-medium flex-shrink-0"
            style={{ background: `${phaseColor}20`, color: phaseColor }}
          >
            {getInitials(client.full_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-[#0f172a]">
                {client.full_name}
              </h2>
              {client.client_type === 'transfer' && (
                <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
                  Transferred
                </span>
              )}
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Week {client.current_week} · Last check-in: –
            </p>
          </div>
        </div>

        {/* Phase badge */}
        <span
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            background: `${phaseColor}15`,
            color: phaseColor,
          }}
        >
          {phaseEmoji} {client.phase}
        </span>
      </div>

      {/* Alert banner */}
     {alertInfo ? (
  <div className="mb-4">
    <AlertBanner message={alertInfo.message} level={alertInfo.level} />
  </div>
) : (
        <div className="mb-4">
          <AlertBanner
            message="On track — no retention flags"
            level="green"
          />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatCard
          label="Week"
          value={`Wk ${client.current_week}`}
        />
        <StatCard
          label="Streak"
          value="–"
          sub="check-ins"
        />
        <StatCard
          label="Adherence"
          value="–"
          color="#00d4d4"
        />
        <StatCard
          label="Lost"
          value={`${weightLost} kg`}
          color="#22c55e"
        />
      </div>

      {/* Progress bars */}
      <div className="mb-4">
        <ProgressBars workout={0} nutrition={0} overall={0} />
      </div>

      {/* Goal */}
      {client.primary_goal && (
        <div className="mb-4 px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
          <span className="text-xs text-[#94a3b8]">Primary goal · </span>
          <span className="text-xs font-medium text-[#0f172a]">
            {client.primary_goal}
          </span>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-4">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">
          Quick actions
        </p>
        <QuickActions
          onReengage={handleReengage}
          onFlag={() => onFlag(client.id, 'red')}
          onViewProfile={handleViewProfile}
        />
      </div>

      {/* Coach notes */}
      <div>
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">
          Coach notes (private)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Add coaching notes for ${client.full_name}...`}
          rows={4}
          className="w-full px-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00d4d4] resize-none transition-colors duration-150"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="text-xs px-4 py-2 bg-[#1a1f3a] text-[#00d4d4] rounded-lg hover:bg-[#141930] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save notes'}
          </button>
        </div>
      </div>

    </div>
  )
}