'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { SLEEP_DURATION, SLEEP_QUALITY, MOOD_OPTIONS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step03Wellbeing({ onNext, onBack }: Props) {
  const { data, updateData } = useCheckinStore()
  const [error, setError] = useState('')

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      mood: data.mood,
      energy_level: data.energy_level,
      sleep_duration: data.sleep_duration,
      sleep_quality: data.sleep_quality,
      stress_level: data.stress_level,
    },
  })

  const mood = watch('mood')
  const energyLevel = watch('energy_level')
  const sleepDuration = watch('sleep_duration')
  const sleepQuality = watch('sleep_quality')
  const stressLevel = watch('stress_level')

  const onSubmit = (values: any) => {
    if (!mood) {
      setError('Please select your mood for this week.')
      return
    }
    if (!energyLevel) {
      setError('Please rate your energy level.')
      return
    }
    setError('')
    updateData({
      ...values,
      mood,
      energy_level: energyLevel,
      sleep_duration: sleepDuration,
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
    })
    onNext()
  }

  return (
    <SectionCard
      section={3}
      total={6}
      title="How did you feel this week?"
      subtitle="Your body is always telling you something. These signals matter as much as the numbers."
    >
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Overall mood this week
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.emoji}
              type="button"
              onClick={() => { setValue('mood', opt.emoji); setError('') }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-150 ${
                mood === opt.emoji
                  ? 'border-[#00d4d4] bg-[#00d4d4]/5 scale-110'
                  : 'border-[#e2e8f0] hover:border-[#00d4d4]'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs text-[#64748b]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ScaleSelect
        label="Average energy level this week"
        required
        value={energyLevel}
        onChange={(v) => { setValue('energy_level', v); setError('') }}
        lowLabel="Exhausted"
        highLabel="Incredible"
      />

      <RadioGroup
        label="Average sleep per night"
        options={SLEEP_DURATION}
        value={sleepDuration}
        onChange={(v) => setValue('sleep_duration', v)}
      />

      <RadioGroup
        label="Sleep quality"
        options={SLEEP_QUALITY}
        value={sleepQuality}
        onChange={(v) => setValue('sleep_quality', v)}
      />

      <ScaleSelect
        label="Stress level this week"
        value={stressLevel}
        onChange={(v) => setValue('stress_level', v)}
        lowLabel="Very low"
        highLabel="Extremely high"
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