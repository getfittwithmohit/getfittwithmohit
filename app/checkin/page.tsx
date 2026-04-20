'use client'

import { useState } from 'react'
import { useCheckinStore } from '@/store/checkinStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SuccessScreen } from '@/components/layout/SuccessScreen'
import { Step01Metrics } from '@/components/forms/checkin/Step01Metrics'
import { Step02Adherence } from '@/components/forms/checkin/Step02Adherence'
import { Step03Wellbeing } from '@/components/forms/checkin/Step03Wellbeing'
import { Step04Wins } from '@/components/forms/checkin/Step04Wins'
import { Step05Mindset } from '@/components/forms/checkin/Step05Mindset'
import { Step06BookCall } from '@/components/forms/checkin/Step06BookCall'
import { supabase } from '@/lib/supabase/client'

const TOTAL_STEPS = 6

// Get day name for the header
const getDayGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function CheckinPage() {
  const { currentStep, setStep, data, reset } = useCheckinStore()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const next = () => setStep(currentStep + 1)
  const back = () => setStep(currentStep - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Get client_id from URL
      const params = new URLSearchParams(window.location.search)
      const clientId = params.get('client')

      await supabase.from('weekly_checkins').insert({
        client_id: clientId || null,
        week_number: null,
        weight_kg: parseFloat(data.weight_kg) || null,
        waist_inches: parseFloat(data.waist_inches) || null,
        workouts_completed: parseInt(data.workouts_completed) || null,
        workout_intensity: data.workout_intensity,
        nutrition_adherence: parseInt(data.nutrition_adherence) || null,
        water_intake: data.water_intake,
        meals_followed: data.meals_followed,
        mood: data.mood,
        energy_level: parseInt(data.energy_level) || null,
        sleep_duration: data.sleep_duration,
        sleep_quality: data.sleep_quality,
        stress_level: parseInt(data.stress_level) || null,
        biggest_win: data.wins_description,
        biggest_challenge: data.challenges_description,
        real_life_context: data.real_life_context,
        mindset_answer: data.mindset_answer,
        why_connection: parseInt(data.why_connection) || null,
        needs_from_coach: data.needs_from_coach,
        week_rating: parseInt(data.week_rating) || null,
        call_booked: true,
      })

      reset()
      setSubmitted(true)
    } catch (error: any) {
      console.error('Checkin error:', error)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        name="you"
        message="Check-in submitted! Coach Mohit will review it before your call. Show up ready — he'll have everything he needs to make your session count."
      />
    )
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
          Weekly Check-In
        </h2>
        <p className="text-white/60 text-sm mt-1 max-w-md mx-auto leading-relaxed">
          {getDayGreeting()} · Friday evening · Takes 8–10 minutes ·
          Be honest — this is your time
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <ProgressBar current={currentStep} total={TOTAL_STEPS} />
      </div>

      {/* Sections */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {currentStep === 1 && (
          <Step01Metrics onNext={next} />
        )}
        {currentStep === 2 && (
          <Step02Adherence onNext={next} onBack={back} />
        )}
        {currentStep === 3 && (
          <Step03Wellbeing onNext={next} onBack={back} />
        )}
        {currentStep === 4 && (
          <Step04Wins onNext={next} onBack={back} />
        )}
        {currentStep === 5 && (
          <Step05Mindset onNext={next} onBack={back} />
        )}
        {currentStep === 6 && (
          <Step06BookCall
            onNext={handleSubmit}
            onBack={back}
            submitting={submitting}
          />
        )}

      </div>
    </div>
  )
}