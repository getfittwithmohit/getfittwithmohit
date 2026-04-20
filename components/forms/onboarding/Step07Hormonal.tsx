'use client'

import { useForm } from 'react-hook-form'
import { HormonalData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Textarea,
  RadioGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { CYCLE_REGULARITY } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step07Hormonal({ onNext, onBack }: Props) {
  const { data, updateHormonal } = useOnboardingStore()

  const { register, handleSubmit, setValue, watch } =
    useForm<HormonalData>({ defaultValues: data.hormonal })

  const cycleRegularity = watch('cycle_regularity')
  const moodFluctuations = watch('mood_fluctuations')
  const hormonalConditions = watch('hormonal_conditions')

  const onSubmit = (values: HormonalData) => {
    updateHormonal(values)
    onNext()
  }

  return (
    <SectionCard
      section={7}
      title="Hormonal Health"
      subtitle="Helps Coach Mohit periodise your training and nutrition around your hormonal cycle for better results."
    >
      <RadioGroup
        label="Menstrual cycle regularity"
        options={CYCLE_REGULARITY}
        value={cycleRegularity}
        onChange={(v) => setValue('cycle_regularity', v)}
      />

      <RadioGroup
        label="Significant energy or mood fluctuations during your cycle?"
        options={['Yes, significantly', 'Mildly', 'Not really']}
        value={moodFluctuations}
        onChange={(v) => setValue('mood_fluctuations', v)}
      />

      <RadioGroup
        label="Diagnosed with PCOD, PCOS or any hormonal condition?"
        options={['Yes', 'No', 'Unsure']}
        value={hormonalConditions}
        onChange={(v) => setValue('hormonal_conditions', v)}
      />

      <Textarea
        label="Any additional hormonal context Coach Mohit should know?"
        placeholder="Feel free to share anything relevant..."
        {...register('additional_context')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}