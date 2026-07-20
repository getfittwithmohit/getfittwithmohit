'use client'

import { useEffect } from 'react' 
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
import { MeasurementGuide } from '@/components/ui/MeasurementGuide'

interface Props {
  onNext: () => void
  onBack: () => void
}

const FEET_OPTIONS = [3, 4, 5, 6, 7]
const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => i) // 0–11

function totalToFeetInches(totalInches: number) {
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

export function Step02Metrics({ onNext, onBack }: Props) {
  const { data, updateMetrics } = useOnboardingStore()

  const existingHeight = data.metrics?.height_inches
    ? totalToFeetInches(Number(data.metrics.height_inches))
    : { feet: 5, inches: 6 }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MetricsData & { height_feet?: number; height_in_remainder?: number }>({
    resolver: zodResolver(metricsSchema) as any,
    defaultValues: {
      ...data.metrics,
      height_feet: existingHeight.feet,
      height_in_remainder: existingHeight.inches,
    },
  })

  useEffect(() => {
  setValue('height_inches', String(heightFeet * 12 + heightInchRemainder), { shouldValidate: false })
}, [])
  const primaryGoal = watch('primary_goal')
  const heightFeet = watch('height_feet' as any) ?? 5
  const heightInchRemainder = watch('height_in_remainder' as any) ?? 6

  const onSubmit = (values: any) => {
    const totalInches = (Number(values.height_feet) || 0) * 12 + (Number(values.height_in_remainder) || 0)
    updateMetrics({ ...values, height_inches: totalInches })
    onNext()
  }

  return (
    <SectionCard
      section={2}
      title="Body Metrics"
      subtitle="Your starting point. These numbers are never judged — they are simply your baseline."
    >
      {/* Height — Feet + Inches */}
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Height
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] mb-1 block">Feet</label>
            <select
              value={heightFeet}
              onChange={(e) => {
    const feet = parseInt(e.target.value)
    setValue('height_feet' as any, feet)
    setValue('height_inches', String(feet * 12 + heightInchRemainder), { shouldValidate: true })
  }}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
            >
              {FEET_OPTIONS.map((f) => (
                <option key={f} value={f}>{f} ft</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8] mb-1 block">Inches</label>
            <select
              value={heightInchRemainder}
              onChange={(e) => {
    const inch = parseInt(e.target.value)
    setValue('height_in_remainder' as any, inch)
    setValue('height_inches', String(heightFeet * 12 + inch), { shouldValidate: true })
  }}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
            >
              {INCH_OPTIONS.map((i) => (
                <option key={i} value={i}>{i} in</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1.5">
          {heightFeet}' {heightInchRemainder}" — {heightFeet * 12 + heightInchRemainder} inches total
        </p>
         {errors.height_inches && (
          <p className="text-xs text-red-500 mt-1">{errors.height_inches.message}</p>
        )}
      </div>

      {/* Weight, Age */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Weight (kg)"
            required
            type="number"
            placeholder="80"
            error={errors.weight_kg?.message}
            {...register('weight_kg')}
          />
          <MeasurementGuide type="weight" />
        </div>
        <Input
          label="Age"
          type="number"
          placeholder="32"
          {...register('age')}
        />
      </div>

      {/* Waist, Chest, Hip */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Input
            label="Waist (inches)"
            type="number"
            placeholder="34"
            {...register('waist_inches')}
          />
          <MeasurementGuide type="waist" />
        </div>
        <div>
          <Input
            label="Chest (inches)"
            type="number"
            placeholder="38"
            {...register('chest_inches')}
          />
          <MeasurementGuide type="chest" />
        </div>
        <div>
          <Input
            label="Hip (inches)"
            type="number"
            placeholder="37"
            {...register('hip_inches')}
          />
          <MeasurementGuide type="hip" />
        </div>
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