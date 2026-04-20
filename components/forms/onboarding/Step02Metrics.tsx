'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { metricsSchema } from '@/lib/validations/onboarding'
import { MetricsData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Input,
  RadioGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { GOAL_OPTIONS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step02Metrics({ onNext, onBack }: Props) {
  const { data, updateMetrics } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MetricsData>({
    resolver: zodResolver(metricsSchema) as any,
    defaultValues: data.metrics,
  })

  const primaryGoal = watch('primary_goal')

  const onSubmit = (values: MetricsData) => {
    updateMetrics(values)
    onNext()
  }

  return (
    <SectionCard
      section={2}
      title="Body Metrics"
      subtitle="Your starting point. These numbers are never judged — they are simply your baseline."
    >
      {/* Height, Weight, Age */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Height (inches)"
          required
          type="number"
          placeholder="68"
          error={errors.height_inches?.message}
          {...register('height_inches')}
        />
        <Input
          label="Weight (kg)"
          required
          type="number"
          placeholder="80"
          error={errors.weight_kg?.message}
          {...register('weight_kg')}
        />
        <Input
          label="Age"
          type="number"
          placeholder="32"
          {...register('age')}
        />
      </div>

      {/* Waist, Chest, Hip */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Waist (inches)"
          type="number"
          placeholder="34"
          {...register('waist_inches')}
        />
        <Input
          label="Chest (inches)"
          type="number"
          placeholder="38"
          {...register('chest_inches')}
        />
        <Input
          label="Hip (inches)"
          type="number"
          placeholder="37"
          {...register('hip_inches')}
        />
      </div>

      {/* Primary Goal */}
      <RadioGroup
        label="Primary goal"
        required
        options={GOAL_OPTIONS}
        value={primaryGoal}
        onChange={(v) => setValue('primary_goal', v, { shouldValidate: true })}
        error={errors.primary_goal?.message}
      />

      {/* Target Weight */}
      <Input
        label="Target weight (kg)"
        type="number"
        placeholder="70"
        {...register('target_weight_kg')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}