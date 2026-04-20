'use client'

import { useForm } from 'react-hook-form'
import { NutritionData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Input,
  RadioGroup,
  CheckGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import {
  DIET_OPTIONS,
  MEALS_PER_DAY,
  EATING_OUT,
  DIGESTION_ISSUES,
  WATER_INTAKE,
} from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step06Nutrition({ onNext, onBack }: Props) {
  const { data, updateNutrition } = useOnboardingStore()

  const { register, handleSubmit, setValue, watch } =
    useForm<NutritionData>({ defaultValues: data.nutrition })

  const dietPreference = watch('diet_preference')
  const mealsPerDay = watch('meals_per_day')
  const eatingOut = watch('eating_out_frequency')
  const digestionIssues = watch('digestion_issues') || []
  const waterIntake = watch('water_intake')

  const toggleDigestion = (val: string) => {
    const updated = digestionIssues.includes(val)
      ? digestionIssues.filter((d) => d !== val)
      : [...digestionIssues, val]
    setValue('digestion_issues', updated)
  }

  const onSubmit = (values: NutritionData) => {
    updateNutrition(values)
    onNext()
  }

  return (
    <SectionCard
      section={6}
      title="Nutrition & Digestion"
      subtitle="Your food is your fuel. Let's understand your current relationship with it."
    >
      <RadioGroup
        label="Diet preference"
        required
        options={DIET_OPTIONS}
        value={dietPreference}
        onChange={(v) => setValue('diet_preference', v)}
      />

      <Input
        label="Food allergies or intolerances"
        placeholder="e.g. lactose, gluten, peanuts..."
        {...register('allergies')}
      />

      <Input
        label="Foods you dislike or won't eat"
        placeholder="e.g. bitter gourd, fish, mushrooms..."
        {...register('disliked_foods')}
      />

      <RadioGroup
        label="Meals per day"
        options={MEALS_PER_DAY}
        value={mealsPerDay}
        onChange={(v) => setValue('meals_per_day', v)}
      />

      <RadioGroup
        label="How often do you eat out or order food?"
        options={EATING_OUT}
        value={eatingOut}
        onChange={(v) => setValue('eating_out_frequency', v)}
      />

      <CheckGroup
        label="Any digestion or gut health issues?"
        options={DIGESTION_ISSUES}
        values={digestionIssues}
        onChange={toggleDigestion}
      />

      <RadioGroup
        label="Daily water intake"
        options={WATER_INTAKE}
        value={waterIntake}
        onChange={(v) => setValue('water_intake', v)}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}