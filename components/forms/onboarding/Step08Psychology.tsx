'use client'

import { useForm } from 'react-hook-form'
import { PsychologyData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Textarea,
  RadioGroup,
  CheckGroup,
  ScaleSelect,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { SUPPORT_SYSTEM } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step08Psychology({ onNext, onBack }: Props) {
  const { data, updatePsychology } = useOnboardingStore()

  const { register, handleSubmit, setValue, watch } =
    useForm<PsychologyData>({ defaultValues: data.psychology })

  const readinessScore = watch('readiness_score')
  const willingnessScore = watch('willingness_score')
  const supportSystem = watch('support_system') || []

  const toggleSupport = (val: string) => {
    const updated = supportSystem.includes(val)
      ? supportSystem.filter((s) => s !== val)
      : [...supportSystem, val]
    setValue('support_system', updated)
  }

  const onSubmit = (values: PsychologyData) => {
    updatePsychology(values)
    onNext()
  }

  return (
    <SectionCard
      section={8}
      title="Psychology of Change"
      subtitle="The most important section. Your honest answers here will make Coach Mohit's programme 10x more effective for you."
    >
      <Textarea
        label="What have you tried before to improve your fitness or health?"
        placeholder="e.g. gym memberships, diets, apps, previous coaches, YouTube workouts..."
        {...register('previous_attempts')}
      />

      <Textarea
        label="Why do you think those attempts didn't last?"
        hint="Be honest — this is one of the most valuable things you can share."
        placeholder="e.g. lost motivation, no accountability, unrealistic plan, life got in the way..."
        {...register('why_didnt_last')}
      />

      <ScaleSelect
        label="How ready are you to change right now?"
        required
        value={readinessScore}
        onChange={(v) => setValue('readiness_score', v)}
        lowLabel="Not ready at all"
        highLabel="100% committed"
      />

      <ScaleSelect
        label="How willing are you to follow a structured plan?"
        value={willingnessScore}
        onChange={(v) => setValue('willingness_score', v)}
        lowLabel="Not willing"
        highLabel="Fully willing"
      />

      <Textarea
        label="What is your biggest fear about this journey?"
        placeholder="e.g. losing motivation again, not seeing results fast enough, finding the time..."
        {...register('biggest_fear')}
      />

      <CheckGroup
        label="Who in your life supports your fitness goals?"
        options={SUPPORT_SYSTEM}
        values={supportSystem}
        onChange={toggleSupport}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}