'use client'

import { toast } from '@/lib/ui/feedback'
import { useState } from 'react'
import { useIdentityStore } from '@/store/identityStore'
import { FormShell } from '@/components/layout/FormShell'
import { NavButtons } from '@/components/ui/NavButtons'
import { IdentityCard } from '@/components/identity/IdentityCard'
import { SuccessScreen } from '@/components/layout/SuccessScreen'
import { Step01SurfaceGoal } from '@/components/forms/identity/Step01SurfaceGoal'
import { Step02DeepWhy } from '@/components/forms/identity/Step02DeepWhy'
import { Step03LifeVision } from '@/components/forms/identity/Step03LifeVision'
import { Step04IdentityPerson } from '@/components/forms/identity/Step04IdentityPerson'
import { Step05Values } from '@/components/forms/identity/Step05Values'
import { Step06Obstacle } from '@/components/forms/identity/Step06Obstacle'
import { Step07IdentityStatement } from '@/components/forms/identity/Step07IdentityStatement'
import { Step08Anchor } from '@/components/forms/identity/Step08Anchor'
import { Step09Commitment } from '@/components/forms/identity/Step09Commitment'
import { supabase } from '@/lib/supabase/client'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'

const TOTAL_STEPS = 9

// Phase labels for each step
const PHASE_LABELS: Record<number, { phase: string; color: string }> = {
  1: { phase: 'Reflect', color: '#4a7fd4' },
  2: { phase: 'Reflect', color: '#4a7fd4' },
  3: { phase: 'Reflect', color: '#4a7fd4' },
  4: { phase: 'Identity', color: '#00D4E8' },
  5: { phase: 'Identity', color: '#00D4E8' },
  6: { phase: 'Reflect', color: '#4a7fd4' },
  7: { phase: 'Identity', color: '#00D4E8' },
  8: { phase: 'Commitment', color: '#22c55e' },
  9: { phase: 'Commitment', color: '#22c55e' },
}

export default function IdentityPage() {
  const { checking } = useAuthGuard()
  

  const { currentStep, setStep, data, reset } = useIdentityStore()
  const [showCard, setShowCard] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [coachNotes, setCoachNotes] = useState('')

  if (checking) return <PageLoader />

  const next = () => {
    if (currentStep === TOTAL_STEPS) {
      setShowCard(true)
      return
    }
    setStep(currentStep + 1)
  }

  const back = () => {
    if (showCard) {
      setShowCard(false)
      return
    }
    setStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Get client_id from URL param e.g. /identity?client=uuid
// Get current client automatically from auth
const { data: { user } } = await supabase.auth.getUser()

let clientId = null
if (user) {
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  clientId = client?.id || null
}

await supabase.from('identity_cards').insert({
  client_id: clientId,
  surface_goal: data.surface_goal,
  deep_why: data.deep_why,
  life_vision: data.life_vision,
  identity_person: data.identity_person,
  values: data.values,
  obstacle: data.obstacle,
  identity_statement: data.identity_statement,
  reengagement_anchor: data.reengagement_anchor,
  personal_commitment: data.personal_commitment,
  coach_notes: coachNotes,
})
      reset()
      setSubmitted(true)
    } catch (error) {
      console.error('Identity submit error:', error)
      toast('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  
  if (submitted) {
    return (
      <SuccessScreen
        name="you"
        message="Your Identity Card has been saved. Coach Mohit will keep it and return to it every time you need a reminder of why you started."
      />
    )
  }

  const phaseInfo = PHASE_LABELS[currentStep]

  return (
    <FormShell
      eyebrow="Purpose & Identity"
      title={showCard ? 'Who you are becoming' : 'A conversation with yourself'}
      subtitle={showCard ? undefined : 'This is not a form. Take your time — your honest answers here become your anchor.'}
      badge={showCard ? undefined : { text: `Phase: ${phaseInfo.phase}`, color: phaseInfo.color }}
      progress={showCard ? undefined : { current: currentStep, total: TOTAL_STEPS, label: `Step ${currentStep} of ${TOTAL_STEPS}` }}
      stepKey={showCard ? 'card' : currentStep}
    >
        {/* Steps */}
        {!showCard && (
          <>
            {currentStep === 1 && <Step01SurfaceGoal onNext={next} />}
            {currentStep === 2 && <Step02DeepWhy onNext={next} onBack={back} />}
            {currentStep === 3 && <Step03LifeVision onNext={next} onBack={back} />}
            {currentStep === 4 && <Step04IdentityPerson onNext={next} onBack={back} />}
            {currentStep === 5 && <Step05Values onNext={next} onBack={back} />}
            {currentStep === 6 && <Step06Obstacle onNext={next} onBack={back} />}
            {currentStep === 7 && <Step07IdentityStatement onNext={next} onBack={back} />}
            {currentStep === 8 && <Step08Anchor onNext={next} onBack={back} />}
            {currentStep === 9 && <Step09Commitment onNext={next} onBack={back} />}
          </>
        )}

        {/* Identity Card view */}
        {showCard && (
          <>
            <p className="m-0 px-1 text-[15px] leading-relaxed text-[#64748b]">
              Coach Mohit will keep this card and return to it every time you need a reminder of why you started.
            </p>

            <IdentityCard
              data={data}
              clientName=""
              showCoachPanel={true}
              coachNotes={coachNotes}
              onCoachNotesChange={setCoachNotes}
            />

            <NavButtons onBack={back} onNext={handleSubmit} loading={submitting} nextLabel="Submit & complete" />
          </>
        )}
    </FormShell>
  )
}