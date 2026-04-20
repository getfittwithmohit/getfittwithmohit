'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fitnessSchema } from '@/lib/validations/onboarding'
import { FitnessData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Input,
  RadioGroup,
  CheckGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import {
  FITNESS_LEVELS,
  ENVIRONMENTS,
  TRAINING_DAYS,
  SESSION_DURATION,
} from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step04Fitness({ onNext, onBack }: Props) {
  const { data, updateFitness } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FitnessData>({
    resolver: zodResolver(fitnessSchema) as any,
    defaultValues: data.fitness,
  })

  const fitnessLevel = watch('fitness_level')
  const environments = watch('environments') || []
  const trainingDays = watch('training_days')
  const sessionDuration = watch('session_duration')

  const toggleEnvironment = (val: string) => {
    const updated = environments.includes(val)
      ? environments.filter((e) => e !== val)
      : [...environments, val]
    setValue('environments', updated)
  }

  const onSubmit = (values: FitnessData) => {
    updateFitness(values)
    onNext()
  }

  return (
    <SectionCard
      section={4}
      title="Fitness Background"
      subtitle="Coach Mohit meets you exactly where you are — no judgment, no assumptions."
    >
      {/* Fitness Level */}
      <RadioGroup
        label="Current fitness level"
        required
        options={FITNESS_LEVELS}
        value={fitnessLevel}
        onChange={(v) => setValue('fitness_level', v, { shouldValidate: true })}
        error={errors.fitness_level?.message}
      />

      {/* Environments */}
      <CheckGroup
        label="Training environment available to you"
        options={ENVIRONMENTS}
        values={environments}
        onChange={toggleEnvironment}
      />

      {/* Training Days */}
      <RadioGroup
        label="Days per week available to train"
        required
        options={TRAINING_DAYS}
        value={trainingDays}
        onChange={(v) => setValue('training_days', v, { shouldValidate: true })}
        error={errors.training_days?.message}
      />

      {/* Session Duration */}
      <RadioGroup
        label="How much time can you give per session?"
        options={SESSION_DURATION}
        value={sessionDuration}
        onChange={(v) => setValue('session_duration', v)}
      />

      {/* Current Activities */}
      <Input
        label="Sports or activities you currently do"
        placeholder="e.g. cricket, swimming, yoga, cycling..."
        {...register('current_activities')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}