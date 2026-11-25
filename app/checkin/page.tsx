'use client'

import { celebrate } from '@/lib/ui/feel'
import { toast } from '@/lib/ui/feedback'
import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { StepPhotos } from '@/components/forms/checkin/StepPhotos'
import { getPhotoSets, mergeWeek, photosDue, signPaths, type Pose } from '@/lib/photos/progressPhotos'
import { getDailyCheckins } from '@/lib/supabase/queries/dailyCheckin'
import { prefillFromDaily } from '@/lib/checkin/weeklyPrefill'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'
import { insertWithOptional } from '@/lib/supabase/insertWithOptional'
import type { CheckinFormData } from '@/lib/types/forms'
import { useCheckinStore } from '@/store/checkinStore'
import { Screen, T } from '@/components/ui/ios'
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
import { go } from '@/lib/ui/navigate'

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
  

  const { currentStep, setStep, data, reset, updateData } = useCheckinStore()
  const { client, loading: clientLoading } = useClient()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [photosDone, setPhotosDone] = useState(false)
  const [setup, setSetup] = useState<{
    photosDue: boolean
    fullMeasure: boolean
    previous: { weight_kg: number | null; waist_inches: number | null } | null
    references: Partial<Record<Pose, string>>
    prefilled: boolean
  } | null>(null)

  // Photo week, last week's numbers and this week's daily check-ins. Each
  // part fails on its own; the check-in always opens.
  useEffect(() => {
    if (checking || clientLoading) return
    if (!client) return
    let cancelled = false
    ;(async () => {
      const sets = await getPhotoSets(client.id).catch(() => [])
      const due = photosDue(sets, client.current_week, client.phase)
      const thisWeek = sets.some((x) => x.week === client.current_week)
      const firstWeek = sets.length ? Math.min(...sets.map((x) => x.week)) : null
      let references: Partial<Record<Pose, string>> = {}
      if (due && firstWeek !== null) {
        const first = mergeWeek(sets, firstWeek)
        const urls = await signPaths(Object.values(first)).catch(() => ({} as Record<string, string>))
        references = Object.fromEntries(Object.entries(first).filter(([, p]) => p && urls[p!]).map(([k, p]) => [k, urls[p!]]))
      }
      const prev = await supabase.from('weekly_checkins').select('weight_kg, waist_inches')
        .eq('client_id', client.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
      const days = await getDailyCheckins(client.id, addDaysIST(todayIST(), -6)).catch(() => [])
      const suggested = prefillFromDaily(days)
      const current = useCheckinStore.getState().data as unknown as Record<string, unknown>
      const fill: Partial<CheckinFormData> = {}
      for (const [k, v] of Object.entries(suggested)) if (!current[k] && v) (fill as Record<string, unknown>)[k] = v
      if (cancelled) return
      if (Object.keys(fill).length) updateData(fill)
      setSetup({
        photosDue: due,
        fullMeasure: due || thisWeek,
        previous: prev.data ? { weight_kg: prev.data.weight_kg, waist_inches: prev.data.waist_inches } : null,
        references,
        prefilled: Object.keys(fill).length > 0,
      })
    })().catch((e) => {
      console.error('Check-in setup failed:', e)
      if (!cancelled) setSetup({ photosDue: false, fullMeasure: false, previous: null, references: {}, prefilled: false })
    })
    return () => { cancelled = true }
  }, [checking, clientLoading, client, updateData])

  // No client record (shouldn't happen here): open the check-in as before
  const setupReady = setup ?? (!clientLoading && !client ? { photosDue: false, fullMeasure: false, previous: null, references: {}, prefilled: false } : null)
  if (checking || clientLoading || !setupReady) return <PageLoader />

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
  // Always derive week_number from actual check-in history, never from calendar
// math against start_date — start_date can be edited/corrected later, and
// missed/caught-up weeks would otherwise produce wrong or out-of-order numbers.
const { count } = await supabase
  .from('weekly_checkins')
  .select('*', { count: 'exact', head: true })
  .eq('client_id', client.id)
weekNumber = (count || 0) + 1
}
}

    const { error: saveError } = await insertWithOptional(supabase, 'weekly_checkins', {
      client_id: clientId,
      week_number: weekNumber,
      weight_kg: parseFloat(data.weight_kg) || null,
      waist_inches: parseFloat(data.waist_inches) || null,
      chest_inches: parseFloat(data.chest_inches) || null,
      hip_inches: parseFloat(data.hip_inches) || null,
      lower_belly_inches: parseFloat(data.lower_belly_inches) || null,
      thigh_inches: parseFloat(data.thigh_inches) || null,
      daily_steps: parseInt(data.daily_steps) || null,
      saver_days: parseInt(data.saver_days) || 0,
      health_issues: data.health_issues || null,
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
      biggest_win: [
  ...(data.wins || []),
  data.wins_description
].filter(Boolean).join(' | '),

biggest_challenge: [
  ...(data.challenges || []),
  data.challenges_description
].filter(Boolean).join(' | '),
      real_life_context: data.real_life_context,
      mindset_answer: data.mindset_answer,
      why_connection: parseInt(data.why_connection) || null,
      needs_from_coach: data.needs_from_coach,
      week_rating: parseInt(data.week_rating) || null,
      call_booked: true,
    }, {
      drinks_this_week: data.drinks_this_week || null,
      hunger_level: parseInt(data.hunger_level || '') || null,
      cycle_phase: data.cycle_phase || null,
      trouser_waist_size: data.trouser_waist_size?.trim() || null,
    })
    if (saveError) throw new Error(saveError.message || 'Could not save your check-in')

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
    celebrate()
  } catch (error: any) {
    console.error('Checkin error:', error)
    toast('Something went wrong. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

  if (submitted) {
    return (
      <SuccessScreen
        name="you"
        message="Coach Mohit will review everything before your call. Show up ready — he'll have everything he needs to make your session count."
        showBooking={true}
      />
    )
  }

  const onPhotos = setupReady.photosDue && !photosDone && !!client

  return (
    <Screen>
      <button onClick={() => go('/home')} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Today
      </button>

      {/* Hero */}
      <div className="rounded-3xl p-5" style={{ background: T.navy }}>
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="" className="w-12 h-12 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold tracking-[0.12em] uppercase" style={{ color: T.cyan }}>
              {client?.current_week ? `Week ${client.current_week} · ` : ''}Weekly check-in
            </p>
            <p className="m-0 mt-0.5 text-white text-[22px] leading-tight font-bold">{getDayGreeting()}{client?.full_name ? `, ${client.full_name.split(' ')[0]}` : ''}.</p>
            <p className="m-0 mt-1 text-[15px] text-white/70">About 5 minutes. Be honest — this is your time.</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[13px] font-semibold mb-2 text-white/60">
            <span>{onPhotos ? 'Progress photos first' : `Section ${currentStep} of ${TOTAL_STEPS}`}</span>
            {!onPhotos && <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>}
          </div>
          <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={onPhotos ? 0 : currentStep}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: !onPhotos && i < currentStep ? '100%' : '0%', background: i === currentStep - 1 ? T.cyan : 'rgba(255,255,255,0.75)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div key={onPhotos ? 'photos' : currentStep} className="gfm-page">
        {onPhotos && client ? (
          <StepPhotos
            clientId={client.id}
            week={client.current_week}
            references={setupReady.references}
            onDone={() => { setPhotosDone(true); toast('Photos saved. Now your check-in.', 'success') }}
          />
        ) : (
          <>
        {currentStep === 1 && (
          <Step01Metrics onNext={next} fullMeasure={setupReady.fullMeasure} previous={setupReady.previous ?? undefined} />
        )}
        {currentStep === 2 && (
          <Step02Adherence onNext={next} onBack={back} prefilled={setupReady.prefilled} />
        )}
        {currentStep === 3 && (
          <Step03Wellbeing onNext={next} onBack={back} prefilled={setupReady.prefilled} askCycle={client?.gender === 'Female'} />
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
          </>
        )}
      </div>
    </Screen>
  )
}
