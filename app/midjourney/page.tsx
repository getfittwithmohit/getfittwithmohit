'use client'

import { useState } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SuccessScreen } from '@/components/layout/SuccessScreen'
import { CoachPanel } from '@/components/forms/midjourney/CoachPanel'
import { StepTracker } from '@/components/forms/midjourney/StepTracker'
import { ClientStep01 } from '@/components/forms/midjourney/ClientStep01'
import { ClientStep02 } from '@/components/forms/midjourney/ClientStep02'
import { ClientStep03 } from '@/components/forms/midjourney/ClientStep03'
import { ClientStep04 } from '@/components/forms/midjourney/ClientStep04'
import { supabase } from '@/lib/supabase/client'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'

const TOTAL_CLIENT_STEPS = 4

export default function MidJourneyPage() {
  const { checking } = useAuthGuard()
  

  const {
    mode,
    setMode,
    coach,
    client,
    clientStep,
    setClientStep,
    reset,
  } = useMidJourneyStore()

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (checking) return <PageLoader />

  const next = () => setClientStep(clientStep + 1)
  const back = () => setClientStep(clientStep - 1)

  const handleCoachSend = () => {
    setMode('client')
    setClientStep(1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Create client in database
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          full_name: coach.full_name,
          email: coach.email || null,
          phone: coach.phone || null,
          start_date: coach.start_date || null,
          current_week: coach.current_week || 1,
          phase: coach.phase || 'Adaptation',
          risk_status: coach.risk_status || 'green',
          client_type: 'transfer',
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      // Save body metrics
      if (client.confirmed_weight) {
        await supabase.from('body_metrics').insert({
          client_id: newClient.id,
          weight_kg: parseFloat(client.confirmed_weight) || null,
          waist_inches: parseFloat(client.waist_inches) || null,
        })
      }

      reset()
      setSubmitted(true)
    } catch (error: any) {
      console.error('Mid-journey error:', error)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e2e8f0] max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#a855f7] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path d="M8 16l5 5 11-11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-medium text-[#0f172a] mb-2">
          You're in the system ✓
        </h2>
        <p className="text-sm text-[#64748b] leading-relaxed mb-6">
          Coach Mohit now has everything he needs to personalise your programme.
          Your profile is live and your Identity Card is next.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.href = '/identity'}
            className="w-full py-3 bg-[#1a1f3a] text-[#00d4d4] rounded-xl text-sm font-medium hover:bg-[#141930] transition-colors"
          >
            Complete Purpose & Identity Form →
          </button>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full py-3 border border-[#e2e8f0] text-[#64748b] rounded-xl text-sm hover:bg-[#f8fafc] transition-colors"
          >
            Go to my dashboard
          </button>
        </div>
        <div className="mt-6 bg-[#1a1f3a] rounded-xl py-3 px-6 inline-block">
          <p className="text-[#00d4d4] text-xs font-medium tracking-widest">
            TRANSFORM TO INSPIRE
          </p>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] text-center py-8 px-4">
  <div className="flex flex-col items-center gap-3">
    <img
      src="/logo.png"
      alt="GetFittWithMohit"
      className="w-20 h-20 object-contain"
    />
    <h2 className="text-white text-xl font-medium">
      Mid-Journey Onboarding
    </h2>
    <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
      For existing clients transitioning into the premium system.
    </p>
    <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
      Transferred Client · Existing Journey
    </span>
  </div>
</div>

      {/* Mode toggle */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex bg-[#e2e8f0] rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode('coach')}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${mode === 'coach'
                ? 'bg-[#1a1f3a] text-[#00d4d4]'
                : 'text-[#64748b] hover:text-[#0f172a]'
              }
            `}
          >
            🔒 Coach View — Pre-fill
          </button>
          <button
            onClick={() => setMode('client')}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${mode === 'client'
                ? 'bg-[#1a1f3a] text-[#00d4d4]'
                : 'text-[#64748b] hover:text-[#0f172a]'
              }
            `}
          >
            👤 Client View — Complete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {/* Coach view */}
        {mode === 'coach' && (
          <CoachPanel onSend={handleCoachSend} />
        )}

        {/* Client view */}
        {mode === 'client' && (
          <div>
            {/* Step tracker */}
            <StepTracker
              currentStep={clientStep}
              totalSteps={TOTAL_CLIENT_STEPS}
            />

            {/* Progress */}
            <div className="mb-6">
              <ProgressBar
                current={clientStep}
                total={TOTAL_CLIENT_STEPS}
              />
            </div>

            {clientStep === 1 && (
              <ClientStep01 onNext={next} />
            )}
            {clientStep === 2 && (
              <ClientStep02 onNext={next} onBack={back} />
            )}
            {clientStep === 3 && (
              <ClientStep03 onNext={next} onBack={back} />
            )}
            {clientStep === 4 && (
              <ClientStep04
                onNext={handleSubmit}
                onBack={back}
              />
            )}
          </div>
        )}

      </div>
    </div>
  )
}