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
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'

const TOTAL_STEPS = 6

// Get day name for the header
const getDayGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function CheckinPage() {
  const { checking } = useAuthGuard()
  

  const { currentStep, setStep, data, reset } = useCheckinStore()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (checking) return <PageLoader />

  const next = () => setStep(currentStep + 1)
  const back = () => setStep(currentStep - 1)

  const handleSubmit = async () => {
  setSubmitting(true)
  try {
    // Get current client automatically from auth
    const { data: { user } } = await supabase.auth.getUser()

    let clientId = null
let weekNumber = null

if (user) {
  const { data: client } = await supabase
    .from('clients')
    .select('id, start_date')
    .eq('auth_user_id', user.id)
    .single()

  if (client) {
    clientId = client.id
    // Calculate week number
    if (client.start_date) {
      const start = new Date(client.start_date)
      const today = new Date()
      const diff = Math.floor(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
      )
      weekNumber = Math.max(1, diff + 1)
    }
  }
}

    await supabase.from('weekly_checkins').insert({
      client_id: clientId,
      week_number: weekNumber,
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

    // Notify coach
fetch('/api/checkin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: clientId,
    week_number: null,
    workouts_completed: parseInt(data.workouts_completed) || 0,
    nutrition_adherence: parseInt(data.nutrition_adherence) || 0,
    energy_level: parseInt(data.energy_level) || 0,
    mood: data.mood,
    biggest_win: data.wins_description,
    biggest_challenge: data.challenges_description,
    needs_from_coach: data.needs_from_coach,
  }),
}).catch(console.error)

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
  <div className="flex flex-col items-center gap-3">
    <img
      src="/logo.png"
      alt="GetFittWithMohit"
      className="w-20 h-20 object-contain"
    />
    <h2 className="text-white text-xl font-medium">
      Weekly Check-In
    </h2>
    <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
      {getDayGreeting()} · Friday evening · Takes 8–10 minutes ·
      Be honest — this is your time
    </p>
  </div>
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