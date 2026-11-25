'use client'

import { toast } from '@/lib/ui/feedback'
import { useState, useEffect } from 'react'
import { ClientSummary } from '@/hooks/useClients'
import { StatCard } from './StatCard'
import { AlertBanner } from './AlertBanner'
import { ProgressBars } from './ProgressBars'
import { QuickActions } from './QuickActions'
import { getRetentionAlert as calcAlert } from '@/lib/supabase/queries/clients'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { updateClientPhase } from '@/lib/supabase/queries/clients'
import { supabase } from '@/lib/supabase/client'

const PHASE_COLORS: Record<string, string> = {
  Onboarding: '#f59e0b',
  Adaptation: '#4a7fd4',
  Building: '#00D4E8',
  Performance: '#22c55e',
  Maintenance: '#a855f7',
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
        <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] text-[#94a3b8] flex items-center justify-center mb-3"><Icon name="users" size={26} /></div>
        <p className="m-0 text-[17px] font-semibold text-[#0f172a]">Pick a client</p>
        <p className="m-0 mt-1 text-[15px] text-[#64748b]">Their week, flags and quick actions show up here.</p>
      </div>
    )
  }

  const phaseColor = PHASE_COLORS[client.phase] || '#64748b'
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

  const copyAndToast = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(done, 'success')
    } catch {
      window.prompt('Copy this and send it via WhatsApp:', text)
    }
  }

  const handleReengage = () => {
    const first = client.full_name.split(' ')[0]
    const message = pledge
      ? `Hey ${first}, Coach Mohit here.\n\n` +
        `You signed your pledge because: "${pledge.why_transform}"\n\n` +
        `You said you're doing this for: "${pledge.doing_this_for}"\n\n` +
        `That reason hasn't changed. You have. Let's get back on track together.`
      : `Hey ${first}, Coach Mohit here. ` +
        `Just checking in — remember why you started this journey. ` +
        `You've already come this far. Let's talk.`
    copyAndToast(message, `Re-engagement message for ${first} copied — paste it in WhatsApp`)
  }

  const handleViewProfile = () => {
    window.open(`/coach/dashboard/client/${client.id}`, '_blank')
  }

  const handleStartProgramme = async () => {
    const today = new Date().toISOString().split('T')[0]
    await updateClientPhase(client.id, 'Adaptation', today)
    toast(`Programme started for ${client.full_name}: Week 1, Adaptation Phase`, 'success')
    setTimeout(() => window.location.reload(), 1500)
  }

  const handleSendPledge = () => {
    const pledgeUrl = `${window.location.origin}/pledge`
    copyAndToast(
      `Please sign your Commitment Pledge before we start Week 1: ${pledgeUrl}`,
      `Pledge link copied — send it to ${client.full_name.split(' ')[0]} on WhatsApp`
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-5">

      {/* Top — name + phase */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: `${phaseColor}20`, color: phaseColor }}
          >
            {getInitials(client.full_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-[24px] leading-tight font-extrabold tracking-tight text-[#0f172a]">
                {client.full_name}
              </h2>
              {client.client_type === 'transfer' && (
                <span className="text-xs font-semibold bg-[#F5F3FF] text-[#7C3AED] px-2.5 py-1 rounded-full">
                  Transferred
                </span>
              )}
            </div>
            <p className="m-0 text-[15px] text-[#64748b] mt-0.5">
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
          className="text-[13px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            background: `${phaseColor}1A`,
            color: phaseColor,
          }}
        >
          {client.phase}
        </span>
      </div>

      {/* Alert banner */}
      {alertInfo ? (
        <div>
          <AlertBanner message={alertInfo.message} level={alertInfo.level} />
        </div>
      ) : (
        <div>
          <AlertBanner
            message="On track — no retention flags"
            level="green"
          />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
          color="#007A8A"
        />
        <StatCard
          label="Lost"
          value={weightLost !== '–' ? `${weightLost} kg` : '–'}
          color="#16A34A"
        />
      </div>

      {/* Progress bars */}
      <div>
        <ProgressBars
          workout={client.avg_nutrition_adherence * 10 || 0}
          nutrition={client.avg_nutrition_adherence * 10 || 0}
          overall={Math.round((client.current_week / 24) * 100)}
        />
      </div>

      {/* Energy trend */}
      {client.recent_energy.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#475569] uppercase tracking-[0.12em] mb-2.5">
            Energy trend (last {client.recent_energy.length} check-ins)
          </p>
          <div className="flex gap-2 items-end h-[52px]">
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
                <span className="text-[13px] font-semibold text-[#64748b]">{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary goal */}
      {client.primary_goal && (
        <div className="px-4 py-3 bg-[#F7F9FB] rounded-2xl">
          <span className="text-[13px] font-semibold text-[#64748b] block mb-0.5">Primary goal</span>
          <span className="text-base font-medium text-[#0f172a]">
            {client.primary_goal}
          </span>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold text-[#475569] uppercase tracking-[0.12em] mb-2.5">
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
        <div>
          <p className="text-xs font-bold text-[#475569] uppercase tracking-[0.12em] mb-2.5">
            Commitment pledge
          </p>
          <div className="bg-[#F7F9FB] rounded-2xl p-4">
            <p className="m-0 text-[13px] text-[#64748b] mb-3">
              Signed {new Date(pledge.signed_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="m-0 text-[13px] font-semibold text-[#64748b] mb-0.5">
                  Doing this for
                </p>
                <p className="m-0 text-[15px] leading-relaxed text-[#0f172a] italic">
                  "{pledge.doing_this_for}"
                </p>
              </div>
              <div>
                <p className="m-0 text-[13px] font-semibold text-[#64748b] mb-0.5">
                  Why they started
                </p>
                <p className="m-0 text-[15px] leading-relaxed text-[#0f172a] italic">
                  "{pledge.why_transform}"
                </p>
              </div>
              <div>
                <p className="m-0 text-[13px] font-semibold text-[#64748b] mb-0.5">
                  Cost of inconsistency
                </p>
                <p className="m-0 text-[15px] leading-relaxed text-[#0f172a] italic">
                  "{pledge.cost_of_inconsistency}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach notes */}
      <div>
        <p className="text-xs font-bold text-[#475569] uppercase tracking-[0.12em] mb-2.5">
          Coach notes (private)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Add coaching notes for ${client.full_name}...`}
          rows={4}
          className="w-full px-4 py-3 text-base rounded-xl bg-[#F2F4F7] border border-transparent text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 resize-none transition-colors duration-150"
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