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
import { supabase } from '@/lib/supabase/client'
import {
  uploadProgressPhoto,
  uploadBloodWork,
} from '@/lib/utils/upload'
import { signOut } from '@/lib/supabase/queries/auth'
import { useEffect } from 'react'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'



export default function OnboardingPage() {
  const { checking } = useAuthGuard()


  const [checkingClient, setCheckingClient] = useState(true)

  
useEffect(() => {
  async function check() {
    const client = await getCurrentClient()
    if (client) {
      window.location.href = '/home'
    } else {
      setCheckingClient(false)
    }
  }
  check()
}, [])

  const { currentStep, setStep, data, reset } = useOnboardingStore()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [clientId, setClientId] = useState<string>('')

  
  // File state — lives here, not in Zustand
  const [selectedPhotos, setSelectedPhotos] = useState<{
    front: File | null
    side: File | null
    back: File | null
  }>({ front: null, side: null, back: null })

  const [bloodWorkFile, setBloodWorkFile] = useState<File | null>(null)
  const [bloodWorkStatus, setBloodWorkStatus] = useState<string>('')

  if (checking) return <PageLoader />
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
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      const cid = result.clientId

      // Upload progress photos
      if (selectedPhotos.front) {
        await uploadProgressPhoto(cid, 1, 'front', selectedPhotos.front)
      }
      if (selectedPhotos.side) {
        await uploadProgressPhoto(cid, 1, 'side', selectedPhotos.side)
      }
      if (selectedPhotos.back) {
        await uploadProgressPhoto(cid, 1, 'back', selectedPhotos.back)
      }

      // Save progress photos record
      if (selectedPhotos.front || selectedPhotos.side || selectedPhotos.back) {
        await supabase.from('progress_photos').insert({
          client_id: cid,
          week_number: 1,
          front_photo_url: selectedPhotos.front
            ? `${cid}/week-1/front.${selectedPhotos.front.name.split('.').pop()}`
            : null,
          side_photo_url: selectedPhotos.side
            ? `${cid}/week-1/side.${selectedPhotos.side.name.split('.').pop()}`
            : null,
          back_photo_url: selectedPhotos.back
            ? `${cid}/week-1/back.${selectedPhotos.back.name.split('.').pop()}`
            : null,
        })
      }

      // Upload blood work
      console.log('Blood work file:', bloodWorkFile)
      if (bloodWorkFile) {
        const reportUrl = await uploadBloodWork(cid, bloodWorkFile)
        if (reportUrl) {
          await supabase.from('blood_work').insert({
            client_id: cid,
            report_url: reportUrl,
            reviewed: false,
          })
        }
      }

      setClientId(cid)
      reset()
      setSubmitted(true)
    } catch (error: any) {
      console.error('Submit error:', error)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <SuccessScreen
        name={data.personal.first_name || 'there'}
        clientId={clientId}
      />
    )
  }

  if (checkingClient) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
     <div className="bg-[#1a1f3a] text-center py-8 px-4 relative">
  <button
    onClick={signOut}
    className="absolute top-4 right-4 text-xs text-white/30 hover:text-white/60 transition-colors"
  >
    Sign out
  </button>
  <div className="flex flex-col items-center gap-3">
    <img
      src="/logo.png"
      alt="GetFittWithMohit"
      className="w-20 h-20 object-contain"
    />
    <h2 className="text-white text-xl font-medium">
      Client Onboarding
    </h2>
    <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
      Takes 10–12 minutes. Be as honest as possible — the more you
      share, the more personalised your programme will be.
    </p>
  </div>
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
          <Step10Photos
            onNext={next}
            onBack={back}
            onPhotosSelect={setSelectedPhotos}
          />
        )}
        {currentStep === 11 && (
  <Step11BloodWork
    onNext={handleSubmit}
    onBack={back}
    onBloodWorkFile={setBloodWorkFile}
    onBloodWorkStatus={setBloodWorkStatus}
    submitting={submitting}
  />
)}

      </div>
    </div>
  )
}