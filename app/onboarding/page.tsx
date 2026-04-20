'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/store/onboardingStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SuccessScreen } from '@/components/layout/SuccessScreen'
import { Step01Personal } from '@/components/forms/onboarding/Step01Personal'
import { Step02Metrics } from '@/components/forms/onboarding/Step02Metrics'
import { Step03Medical } from '@/components/forms/onboarding/Step03Medical'
import { Step04Fitness } from '@/components/forms/onboarding/Step04Fitness'
import { Step05Lifestyle } from '@/components/forms/onboarding/Step05Lifestyle'
import { Step06Nutrition } from '@/components/forms/onboarding/Step06Nutrition'
import { Step07Hormonal } from '@/components/forms/onboarding/Step07Hormonal'
import { Step08Psychology } from '@/components/forms/onboarding/Step08Psychology'
import { Step09Expectations } from '@/components/forms/onboarding/Step09Expectations'
import { Step10Photos } from '@/components/forms/onboarding/Step10Photos'
import { Step11BloodWork } from '@/components/forms/onboarding/Step11BloodWork'

export default function OnboardingPage() {
  const { currentStep, setStep, data, reset } = useOnboardingStore()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const next = () => {
    // Skip Section 7 (Hormonal) for non-female clients
    if (currentStep === 6 && data.personal.gender !== 'Female') {
      setStep(8)
      return
    }
    setStep(currentStep + 1)
  }

  const back = () => {
    // Skip back over Section 7 for non-female clients
    if (currentStep === 8 && data.personal.gender !== 'Female') {
      setStep(6)
      return
    }
    setStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      reset()
      setSubmitted(true)
    } catch (error) {
      console.error('Submit error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return <SuccessScreen name={data.personal.first_name || 'there'} />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] text-center py-8 px-4">
        <h1 className="text-[#00d4d4] text-lg font-medium tracking-widest">
          GETFITTWITHMOHIT
        </h1>
        <p className="text-white/40 text-xs mt-1">Transform to Inspire</p>
        <h2 className="text-white text-xl font-medium mt-3">
          Client Onboarding
        </h2>
        <p className="text-white/60 text-sm mt-1 max-w-md mx-auto leading-relaxed">
          Takes 10–12 minutes. Be as honest as possible — the more you
          share, the more personalised your programme will be.
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <ProgressBar current={currentStep} total={11} />
      </div>

      {/* Sections */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {currentStep === 1 && (
          <Step01Personal onNext={next} />
        )}
        {currentStep === 2 && (
          <Step02Metrics onNext={next} onBack={back} />
        )}
        {currentStep === 3 && (
          <Step03Medical onNext={next} onBack={back} />
        )}
        {currentStep === 4 && (
          <Step04Fitness onNext={next} onBack={back} />
        )}
        {currentStep === 5 && (
          <Step05Lifestyle onNext={next} onBack={back} />
        )}
        {currentStep === 6 && (
          <Step06Nutrition onNext={next} onBack={back} />
        )}
        {currentStep === 7 && (
          <Step07Hormonal onNext={next} onBack={back} />
        )}
        {currentStep === 8 && (
          <Step08Psychology onNext={next} onBack={back} />
        )}
        {currentStep === 9 && (
          <Step09Expectations onNext={next} onBack={back} />
        )}
        {currentStep === 10 && (
          <Step10Photos onNext={next} onBack={back} />
        )}
        {currentStep === 11 && (
          <Step11BloodWork
            onNext={handleSubmit}
            onBack={back}
          />
        )}

      </div>
    </div>
  )
}