'use client'

import { useState, useEffect } from 'react'
import { ClientSummary } from '@/hooks/useClients'
import { StatCard } from './StatCard'
import { AlertBanner } from './AlertBanner'
import { ProgressBars } from './ProgressBars'
import { QuickActions } from './QuickActions'
import { getRetentionAlert as calcAlert } from '@/lib/supabase/queries/clients'
import { Button } from '@/components/ui/Button'
import { updateClientPhase } from '@/lib/supabase/queries/clients'
import { supabase } from '@/lib/supabase/client'

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
  const [pledge, setPledge] = useState<any>(null)

  useEffect(() => {
    if (client) {
      setNotes(client.coach_notes || '')
    }
  }, [client?.id])

  useEffect(() => {
    if (!client) return
    async function fetchPledge() {
      const { data } = await supabase
        .from('commitment_pledges')
        .select('*')
        .eq('client_id', client!.id)
        .single()
      if (data) setPledge(data)
      else setPledge(null)
    }
    fetchPledge()
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
    if (pledge) {
      window.alert(
        `Re-engagement message for ${client.full_name}:\n\n` +
        `"Hey ${client.full_name.split(' ')[0]}, Coach Mohit here.\n\n` +
        `You signed your pledge because: "${pledge.why_transform}"\n\n` +
        `You said you're doing this for: "${pledge.doing_this_for}"\n\n` +
        `That reason hasn't changed. You have. Let's get back on track together."\n\n` +
        `(Copy and send via WhatsApp)`
      )
    } else {
      window.alert(
        `Re-engagement message for ${client.full_name}:\n\n` +
        `"Hey ${client.full_name.split(' ')[0]}, Coach Mohit here. ` +
        `Just checking in — remember why you started this journey. ` +
        `You've already come this far. Let's talk."\n\n` +
        `(Copy and send via WhatsApp)`
      )
    }
  }

  const handleViewProfile = () => {
    window.alert(
      `Viewing full profile for ${client.full_name}.\n\nFull profile view — coming in next build.`
    )
  }

  const handleStartProgramme = async () => {
    const today = new Date().toISOString().split('T')[0]
    await updateClientPhase(client.id, 'Adaptation', today)
    window.alert(
      `Programme started for ${client.full_name}! They are now in Week 1 — Adaptation Phase.`
    )
    window.location.reload()
  }

  const handleSendPledge = () => {
    const pledgeUrl = `${window.location.origin}/pledge`
    window.alert(
      `Send this link to ${client.full_name} via WhatsApp:\n\n${pledgeUrl}\n\nAsk them to sign their Commitment Pledge before starting Week 1.`
    )
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
              Week {client.current_week} · Last check-in:{' '}
              {client.last_checkin_date
                ? new Date(client.last_checkin_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Never'
              }
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
        <StatCard label="Week" value={`Wk ${client.current_week}`} />
        <StatCard
          label="Streak"
          value={client.checkin_streak || 0}
          sub="check-ins"
        />
        <StatCard
          label="Adherence"
          value={client.avg_nutrition_adherence
            ? `${client.avg_nutrition_adherence}/10`
            : '–'
          }
          color="#00d4d4"
        />
        <StatCard
          label="Lost"
          value={weightLost !== '–' ? `${weightLost} kg` : '–'}
          color="#22c55e"
        />
      </div>

      {/* Progress bars */}
      <div className="mb-4">
        <ProgressBars
          workout={client.avg_nutrition_adherence * 10 || 0}
          nutrition={client.avg_nutrition_adherence * 10 || 0}
          overall={Math.round((client.current_week / 24) * 100)}
        />
      </div>

      {/* Energy trend */}
      {client.recent_energy.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">
            Energy trend (last {client.recent_energy.length} check-ins)
          </p>
          <div className="flex gap-2">
            {client.recent_energy.map((e, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md"
                  style={{
                    height: `${Math.max(e * 4, 8)}px`,
                    background: e >= 7 ? '#22c55e' : e >= 5 ? '#f59e0b' : '#ef4444',
                    opacity: 0.8,
                  }}
                />
                <span className="text-xs text-[#94a3b8]">{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary goal */}
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
          onStartProgramme={handleStartProgramme}
          showStartProgramme={client.phase === 'Onboarding'}
          onSendPledge={handleSendPledge}
        />
      </div>

      {/* Pledge section */}
      {pledge && (
        <div className="mb-4">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">
            Commitment Pledge
          </p>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs text-[#94a3b8] mb-3">
              Signed {new Date(pledge.signed_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-[#64748b] mb-0.5">
                  Doing this for
                </p>
                <p className="text-xs text-[#0f172a] italic">
                  "{pledge.doing_this_for}"
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#64748b] mb-0.5">
                  Why they started
                </p>
                <p className="text-xs text-[#0f172a] italic">
                  "{pledge.why_transform}"
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#64748b] mb-0.5">
                  Cost of inconsistency
                </p>
                <p className="text-xs text-[#0f172a] italic">
                  "{pledge.cost_of_inconsistency}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <Button
            variant="secondary"
            onClick={handleSaveNotes}
            loading={saving}
            className="text-xs px-4 py-2"
          >
            Save notes
          </Button>
        </div>
      </div>

    </div>
  )
}