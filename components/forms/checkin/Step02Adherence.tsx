'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { Textarea } from '@/components/ui/Textarea'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { WORKOUT_INTENSITY, MEALS_FOLLOWED, WATER_INTAKE, DRINKS_THIS_WEEK } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
  prefilled?: boolean
}

const WORKOUT_DAYS = ['0', '1', '2', '3', '4', '5', '6'] as const
const SAVER_DAYS = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

export function Step02Adherence({ onNext, onBack, prefilled = false }: Props) {
  const { data, updateData } = useCheckinStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      workouts_completed: data.workouts_completed,
      workout_intensity: data.workout_intensity,
      nutrition_adherence: data.nutrition_adherence,
      water_intake: data.water_intake,
      meals_followed: data.meals_followed,
      off_plan_foods: data.off_plan_foods,
      saver_days: data.saver_days,
      drinks_this_week: data.drinks_this_week || '',
    },
  })

  const workoutsCompleted = watch('workouts_completed')
  const workoutIntensity = watch('workout_intensity')
  const nutritionAdherence = watch('nutrition_adherence')
  const waterIntake = watch('water_intake')
  const mealsFollowed = watch('meals_followed')
  const saverDays = watch('saver_days')
  const drinks = watch('drinks_this_week')

  const onSubmit = (values: any) => {
    if (!workoutsCompleted) {
      setError('Please select how many workouts you completed this week.')
      return
    }
    if (!nutritionAdherence) {
      setError('Please rate your nutrition adherence.')
      return
    }
    setError('')
    updateData({
      ...values,
      workouts_completed: workoutsCompleted,
      workout_intensity: workoutIntensity,
      nutrition_adherence: nutritionAdherence,
      water_intake: waterIntake,
      meals_followed: mealsFollowed,
      saver_days: saverDays,
      drinks_this_week: drinks,
    })
    onNext()
  }

  return (
    <SectionCard
      section={2}
      total={6}
      title="How did you show up this week?"
      subtitle="Honest numbers only. Coach Mohit can only help you if he knows what actually happened."
    >
      {prefilled && (
        <div className="bg-[#E6F7F9] rounded-2xl px-4 py-3 text-[15px] text-[#0f172a] leading-relaxed">
          <strong>Pre-filled from your daily check-ins.</strong> Just check it and change anything that’s off.
        </div>
      )}
      <div>
        <p className="text-[15px] font-semibold text-[#0f172a] mb-2.5">
          Workouts completed this week
          <span className="text-[#007A8A] ml-0.5">*</span>
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WORKOUT_DAYS.length}, minmax(0, 1fr))` }}>
          {WORKOUT_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => { setValue('workouts_completed', day); setError('') }}
              className={`h-11 rounded-lg text-base font-semibold transition-all duration-150 active:scale-[0.97] ${
                workoutsCompleted === day
                  ? 'bg-[#1a1f3a] text-[#00D4E8]'
                  : 'bg-[#F2F4F7] text-[#475569] hover:bg-[#E8ECF1]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-sm text-[#64748b] mt-1.5 px-1">
          <span>None</span><span>Every day</span>
        </div>
      </div>

      <RadioGroup
        label="Workout intensity this week"
        options={WORKOUT_INTENSITY}
        value={workoutIntensity}
        onChange={(v) => setValue('workout_intensity', v)}
      />

      <ScaleSelect
        label="Nutrition adherence (1 = completely off plan, 10 = perfect)"
        required
        value={nutritionAdherence}
        onChange={(v) => { setValue('nutrition_adherence', v); setError('') }}
        lowLabel="Completely off"
        highLabel="Perfect"
      />

      <RadioGroup
        label="Water intake this week"
        options={WATER_INTAKE}
        value={waterIntake}
        onChange={(v) => setValue('water_intake', v)}
      />

      <RadioGroup
        label="Meals followed per day on average"
        options={MEALS_FOLLOWED}
        value={mealsFollowed}
        onChange={(v) => setValue('meals_followed', v)}
      />

      <div>
        <p className="text-[15px] font-semibold text-[#0f172a] mb-2.5">
          How many days did you complete your SAVER routine?
          <span className="text-[#007A8A] ml-0.5">*</span>
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SAVER_DAYS.length}, minmax(0, 1fr))` }}>
          {SAVER_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setValue('saver_days', day)}
              className={`h-11 rounded-lg text-base font-semibold transition-all duration-150 active:scale-[0.97] ${
                saverDays === day
                  ? 'bg-[#1a1f3a] text-[#00D4E8]'
                  : 'bg-[#F2F4F7] text-[#475569] hover:bg-[#E8ECF1]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-sm text-[#64748b] mt-1.5 px-1">
          <span>None</span><span>Every day</span>
        </div>
      </div>

      <RadioGroup
        label="Alcoholic drinks this week"
        options={DRINKS_THIS_WEEK}
        value={drinks}
        onChange={(v) => setValue('drinks_this_week', v)}
      />

      <Textarea
        label="Anything you ate off-plan?"
        hint="No judgment — just helps Coach Mohit understand your week."
        placeholder="e.g. Had biryani at a wedding on Saturday..."
        {...register('off_plan_foods')}
      />

      {error && (
        <p className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={() => handleSubmit(onSubmit)()} />
    </SectionCard>
  )
}