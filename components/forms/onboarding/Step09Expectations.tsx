'use client'

import { useForm } from 'react-hook-form'
import { ExpectationsData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Textarea,
  RadioGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { REFERRAL_SOURCE } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step09Expectations({ onNext, onBack }: Props) {
  const { data, updateExpectations } = useOnboardingStore()

  const { register, handleSubmit, setValue, watch } =
    useForm<ExpectationsData>({ defaultValues: data.expectations })

  const referralSource = watch('referral_source')

  const onSubmit = (values: ExpectationsData) => {
    updateExpectations(values)
    onNext()
  }

  return (
    <SectionCard
      section={9}
      title="Expectations & Commitment"
      subtitle="Aligning on expectations is how Coach Mohit ensures you get real, lasting results — not just short-term progress."
    >
      <Textarea
        label="What does success look like for you in 3 months?"
        hint="Be as specific as possible — weight, energy, strength, confidence, how you feel."
        placeholder="e.g. I want to lose 8kg, have energy throughout the day, fit into my old clothes..."
        rows={4}
        {...register('success_3_months')}
      />

      <Textarea
        label="What does success look like for you in 12 months?"
        hint="Paint the full picture of your transformed self."
        placeholder="e.g. I want to be the fittest I've ever been, run a 5K, feel confident without a shirt..."
        rows={4}
        {...register('success_12_months')}
      />

      <RadioGroup
        label="How did you hear about GetFittWithMohit?"
        options={REFERRAL_SOURCE}
        value={referralSource}
        onChange={(v) => setValue('referral_source', v)}
      />

      <Textarea
        label="Anything else Coach Mohit should know before designing your programme?"
        placeholder="Life circumstances, mindset, preferences, fears — anything at all..."
        {...register('anything_else')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}