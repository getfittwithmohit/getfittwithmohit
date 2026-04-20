'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lifestyleSchema } from '@/lib/validations/onboarding'
import { LifestyleData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Textarea,
  RadioGroup,
  CheckGroup,
  ScaleSelect,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import {
  SLEEP_DURATION,
  SLEEP_QUALITY,
  STRESS_SOURCES,
  DAILY_STEPS,
} from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step05Lifestyle({ onNext, onBack }: Props) {
  const { data, updateLifestyle } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LifestyleData>({
    resolver: zodResolver(lifestyleSchema) as any,
    defaultValues: data.lifestyle,
  })

  const sleepDuration = watch('sleep_duration')
  const sleepQuality = watch('sleep_quality')
  const stressLevel = watch('stress_level')
  const stressSources = watch('stress_sources') || []
  const dailySteps = watch('daily_steps')

  const toggleStressSource = (val: string) => {
    const updated = stressSources.includes(val)
      ? stressSources.filter((s) => s !== val)
      : [...stressSources, val]
    setValue('stress_sources', updated)
  }

  const onSubmit = (values: LifestyleData) => {
    updateLifestyle(values)
    onNext()
  }

  return (
    <SectionCard
      section={5}
      title="Lifestyle Deep-Dive"
      subtitle="Your lifestyle IS your fitness foundation. Be as honest as possible — there are no wrong answers here."
    >
      {/* Sleep Duration */}
      <RadioGroup
        label="Average sleep per night"
        options={SLEEP_DURATION}
        value={sleepDuration}
        onChange={(v) => setValue('sleep_duration', v)}
      />

      {/* Sleep Quality */}
      <RadioGroup
        label="Sleep quality"
        options={SLEEP_QUALITY}
        value={sleepQuality}
        onChange={(v) => setValue('sleep_quality', v)}
      />

      {/* Stress Level */}
      <ScaleSelect
        label="Current stress level"
        required
        value={stressLevel}
        onChange={(v) => setValue('stress_level', v, { shouldValidate: true })}
        lowLabel="Very low"
        highLabel="Extremely high"
        error={errors.stress_level?.message}
      />

      {/* Stress Sources */}
      <CheckGroup
        label="Main sources of stress in your life"
        options={STRESS_SOURCES}
        values={stressSources}
        onChange={toggleStressSource}
      />

      {/* Day in the Life */}
      <Textarea
        label="Walk us through a typical weekday"
        hint="Wake-up time, meals, work, energy dips, exercise window, bedtime"
        placeholder="e.g. Wake at 7am, skip breakfast, commute 1hr, desk job 9–6, exhausted by 3pm, dinner at 9pm, phone till midnight..."
        rows={4}
        {...register('day_in_life')}
      />

      {/* Daily Steps */}
      <RadioGroup
        label="Daily step count (approximate)"
        options={DAILY_STEPS}
        value={dailySteps}
        onChange={(v) => setValue('daily_steps', v)}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}