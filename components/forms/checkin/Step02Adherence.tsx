'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { Textarea } from '@/components/ui/Textarea'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { WORKOUT_INTENSITY, MEALS_FOLLOWED, WATER_INTAKE } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

const WORKOUT_DAYS = ['0', '1', '2', '3', '4', '5', '6'] as const
const SAVER_DAYS = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

export function Step02Adherence({ onNext, onBack }: Props) {
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
    },
  })

  const workoutsCompleted = watch('workouts_completed')
  const workoutIntensity = watch('workout_intensity')
  const nutritionAdherence = watch('nutrition_adherence')
  const waterIntake = watch('water_intake')
  const mealsFollowed = watch('meals_followed')
  const saverDays = watch('saver_days')

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
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Workouts completed this week
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </p>
        <div className="flex gap-2">
          {WORKOUT_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => { setValue('workouts_completed', day); setError('') }}
              className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all duration-150 ${
                workoutsCompleted === day
                  ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#00d4d4]'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00d4d4]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#94a3b8] mt-1.5 px-1">
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
        <p className="text-xs font-medium text-[#64748b] mb-2">
          How many days did you complete your SAVER routine?
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </p>
        <div className="flex gap-2">
          {SAVER_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setValue('saver_days', day)}
              className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all duration-150 ${
                saverDays === day
                  ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#00d4d4]'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00d4d4]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#94a3b8] mt-1.5 px-1">
          <span>None</span><span>Every day</span>
        </div>
      </div>

      <Textarea
        label="Anything you ate off-plan?"
        hint="No judgment — just helps Coach Mohit understand your week."
        placeholder="e.g. Had biryani at a wedding on Saturday..."
        {...register('off_plan_foods')}
      />

      {error && (
        <p className="text-xs text-[#ef4444] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={() => handleSubmit(onSubmit)()} />
    </SectionCard>
  )
}