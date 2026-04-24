'use client'

import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { signOut } from '@/lib/supabase/queries/auth'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'


const PHASE_EMOJI: Record<string, string> = {
  Onboarding: '📋',
  Adaptation: '🌱',
  Building: '💪',
  Performance: '🔥',
  Maintenance: '🏆',
}

export default function ClientHomePage() {

  const { checking } = useAuthGuard()
  const { client, loading } = useClient()

  const [pledge, setPledge] = useState<any>(null)

useEffect(() => {
  async function fetchPledge() {
    if (!client) return
    const { data } = await supabase
      .from('commitment_pledges')
      .select('doing_this_for, signed_at')
      .eq('client_id', client.id)
      .single()
    if (data) setPledge(data)
  }
  fetchPledge()
}, [client])

  if (checking || loading) {
    return <PageLoader />
  }

if (!client) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-lg font-medium text-[#0f172a] mb-2">
          Welcome to GetFittWithMohit
        </h2>
        <p className="text-sm text-[#64748b] mb-6">
          Let's get you set up. Complete your onboarding to get started.
        </p>
        <button
          onClick={() => window.location.href = '/onboarding'}
          className="bg-[#00d4d4] text-[#1a1f3a] px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
        >
          Start Onboarding →
        </button>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
  <div className="max-w-2xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="GetFittWithMohit"
        className="w-10 h-10 object-contain"
      />
      <div>
        <h1 className="text-[#00d4d4] text-sm font-medium tracking-widest uppercase">
          GetFittWithMohit
        </h1>
        <p className="text-white/50 text-xs mt-0.5">Transform to Inspire</p>
      </div>
    </div>
    <button
      onClick={signOut}
      className="text-xs text-white/40 hover:text-white/70 transition-colors"
    >
      Sign out
    </button>
  </div>
</div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-[#0f172a]">
            Hey {client?.full_name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-sm text-[#64748b] mt-1">
            Here's where you are in your transformation journey.
          </p>
        </div>

        {/* Phase card */}
        <div className="bg-[#1a1f3a] rounded-2xl p-5 mb-4">
  <div className="flex items-center justify-between mb-3">
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wide mb-0.5">
        Current phase
      </p>
      <p className="text-lg font-medium text-white">
        {PHASE_EMOJI[client?.phase || ''] || ''} {client?.phase || '–'}
      </p>
    </div>
    <div className="text-right">
      <p className="text-xs text-white/40 uppercase tracking-wide mb-0.5">
        {client?.phase === 'Onboarding' ? 'Status' : 'Week'}
      </p>
      <p className="text-2xl font-medium text-[#00d4d4]">
        {client?.phase === 'Onboarding'
          ? '📋'
          : client?.current_week || 1
        }
      </p>
    </div>
  </div>

  {client?.phase === 'Onboarding' && (
    <p className="text-xs text-white/40 leading-relaxed">
      Your programme hasn't started yet. Coach Mohit will reach out to schedule your first consultation call.
    </p>
  )}
</div>

{/* Pledge reminder card */}
{pledge ? (
  <button
    onClick={() => window.location.href = '/pledge'}
    className="w-full bg-[#1a1f3a] rounded-2xl p-5 mb-4 text-left hover:bg-[#141930] transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1.5">
          Your pledge · Signed ✓
        </p>
        <p className="text-sm text-white/70 leading-relaxed italic">
          "I am doing this for {pledge.doing_this_for}"
        </p>
      </div>
      <span className="text-white/20 text-sm flex-shrink-0 mt-0.5">→</span>
    </div>
  </button>
) : (
  <button
    onClick={() => window.location.href = '/pledge'}
    className="w-full bg-gradient-to-r from-[#1a1f3a] to-[#2d3561] rounded-2xl p-5 mb-4 text-left border border-[#00d4d4]/20 hover:border-[#00d4d4]/40 transition-colors"
  >
    <p className="text-xs text-[#00d4d4] uppercase tracking-widest mb-1.5">
      Commitment Pledge
    </p>
    <p className="text-sm text-white/60">
      Sign your promise to yourself →
    </p>
  </button>
)}

        {/* Quick actions */}
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          Your forms
        </p>

        <div className="flex flex-col gap-3">
          {[
            {
              label: 'Weekly Check-in',
              description: 'Every Friday evening · 8–10 mins',
              href: '/checkin',
              emoji: '📋',
              color: '#00d4d4',
            },
            {
              label: 'Bi-Weekly Assessment',
              description: 'Every 2 weeks · 20–30 mins',
              href: '/assessment',
              emoji: '💪',
              color: '#4a7fd4',
            },
            {
              label: 'Purpose & Identity',
              description: 'Your why, values and commitment',
              href: '/identity',
              emoji: '🎯',
              color: '#a855f7',
            },
            {
  label: 'Commitment Pledge',
  description: 'Sign your promise to yourself',
  href: '/pledge',
  emoji: '✊',
  color: '#1a1f3a',
},{
  label: 'My Progress',
  description: 'View your transformation journey',
  href: '/home/progress',
  emoji: '📊',
  color: '#22c55e',
},
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => window.location.href = item.href}
              className="flex items-center gap-4 bg-white border border-[#e2e8f0] rounded-xl p-4 text-left hover:border-[#00d4d4] transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${item.color}15` }}
              >
                {item.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0f172a]">
                  {item.label}
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {item.description}
                </p>
              </div>
              <span className="text-[#94a3b8] text-sm">→</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}