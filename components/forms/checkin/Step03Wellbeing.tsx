'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { SLEEP_DURATION, SLEEP_QUALITY, MOOD_OPTIONS, CYCLE_PHASE } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
  prefilled?: boolean
  askCycle?: boolean
}

export function Step03Wellbeing({ onNext, onBack, prefilled = false, askCycle = false }: Props) {
  const { data, updateData } = useCheckinStore()
  const [error, setError] = useState('')

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      mood: data.mood,
      energy_level: data.energy_level,
      sleep_duration: data.sleep_duration,
      sleep_quality: data.sleep_quality,
      stress_level: data.stress_level,
      hunger_level: data.hunger_level || '',
      cycle_phase: data.cycle_phase || '',
    },
  })

  const mood = watch('mood')
  const energyLevel = watch('energy_level')
  const sleepDuration = watch('sleep_duration')
  const sleepQuality = watch('sleep_quality')
  const stressLevel = watch('stress_level')
  const hungerLevel = watch('hunger_level')
  const cyclePhase = watch('cycle_phase')

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
      hunger_level: hungerLevel,
      cycle_phase: cyclePhase,
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
      {prefilled && (
        <div className="bg-[#E6F7F9] rounded-2xl px-4 py-3 text-[15px] text-[#0f172a] leading-relaxed">
          <strong>Pre-filled from your daily check-ins.</strong> Just check it and change anything that’s off.
        </div>
      )}
      <div>
        <p className="text-[15px] font-semibold text-[#0f172a] mb-2.5">
          Overall mood this week
          <span className="text-[#007A8A] ml-0.5">*</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.emoji}
              type="button"
              onClick={() => { setValue('mood', opt.emoji); setError('') }}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 min-w-[4.5rem] rounded-2xl transition-all duration-150 ${
                mood === opt.emoji
                  ? 'bg-[#E6F7F9] ring-2 ring-[#00D4E8] scale-105'
                  : 'bg-[#F2F4F7] hover:bg-[#E8ECF1]'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-sm text-[#64748b]">{opt.label}</span>
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

      <ScaleSelect
        label="Hunger & cravings this week (1 = barely, 10 = constant)"
        value={hungerLevel}
        onChange={(v) => setValue('hunger_level', v)}
        lowLabel="Barely hungry"
        highLabel="Constant cravings"
      />

      {askCycle && (
        <RadioGroup
          label="Where were you in your cycle this week? (optional)"
          options={CYCLE_PHASE}
          value={cyclePhase}
          onChange={(v) => setValue('cycle_phase', v)}
        />
      )}

      {error && (
        <p className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={() => handleSubmit(onSubmit)()} />
    </SectionCard>
  )
}