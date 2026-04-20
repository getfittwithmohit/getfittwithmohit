'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalSchema } from '@/lib/validations/onboarding'
import { MedicalData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Textarea,
  RadioGroup,
  CheckGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { MEDICAL_CONDITIONS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step03Medical({ onNext, onBack }: Props) {
  const { data, updateMedical } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<MedicalData>({
    resolver: zodResolver(medicalSchema) as any,
    defaultValues: data.medical,
  })

  const conditions = watch('conditions') || []
  const recentSurgery = watch('recent_surgery')

  const toggleCondition = (val: string) => {
    const updated = conditions.includes(val)
      ? conditions.filter((c) => c !== val)
      : [...conditions, val]
    setValue('conditions', updated)
  }

  const onSubmit = (values: MedicalData) => {
    updateMedical(values)
    onNext()
  }

  return (
    <SectionCard
      section={3}
      title="Medical History & Injuries"
      subtitle="Strictly confidential. Helps Coach Mohit design a safe programme for you."
    >
      {/* Conditions */}
      <CheckGroup
        label="Current or past medical conditions"
        options={MEDICAL_CONDITIONS}
        values={conditions}
        onChange={toggleCondition}
      />

      {/* Injuries */}
      <Textarea
        label="Current injuries or physical limitations"
        placeholder="e.g. lower back pain, knee injury, shoulder impingement..."
        {...register('injuries')}
      />

      {/* Medications */}
      <Textarea
        label="Medications or supplements you take regularly"
        placeholder="List any medications or supplements..."
        {...register('medications')}
      />

      {/* Recent Surgery */}
      <RadioGroup
        label="Have you had any surgeries in the last 2 years?"
        options={['Yes', 'No']}
        value={recentSurgery}
        onChange={(v) => setValue('recent_surgery', v)}
      />

      {/* Doctor's Care */}
      <Textarea
        label="Are you currently under a doctor's care for anything?"
        placeholder="If yes, please describe..."
        {...register('doctors_care')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}