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
          <span className="text-[#00D4E8] ml-0.5">*</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Feet</label>
            <select
              value={heightFeet}
              onChange={(e) => {
    const feet = parseInt(e.target.value)
    setValue('height_feet' as any, feet)
    setValue('height_inches', String(feet * 12 + heightInchRemainder), { shouldValidate: true })
  }}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00D4E8] transition-colors"
            >
              {FEET_OPTIONS.map((f) => (
                <option key={f} value={f}>{f} ft</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Inches</label>
            <select
              value={heightInchRemainder}
              onChange={(e) => {
    const inch = parseInt(e.target.value)
    setValue('height_in_remainder' as any, inch)
    setValue('height_inches', String(heightFeet * 12 + inch), { shouldValidate: true })
  }}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00D4E8] transition-colors"
            >
              {INCH_OPTIONS.map((i) => (
                <option key={i} value={i}>{i} in</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#64748b] mt-1.5">
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

      {/* Measurements — the baseline for "inches lost" */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#475569] leading-relaxed">
        Grab a soft measuring tape. These five numbers are your starting point — the scale lies sometimes, the tape rarely does.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input label="Waist (inches)" required type="number" inputMode="decimal" placeholder="34" error={errors.waist_inches?.message} {...register('waist_inches')} />
          <MeasurementGuide type="waist" />
        </div>
        <div>
          <Input label="Lower belly (inches)" required type="number" inputMode="decimal" placeholder="36" error={errors.lower_belly_inches?.message} {...register('lower_belly_inches')} />
          <MeasurementGuide type="belly" />
        </div>
        <div>
          <Input label="Chest (inches)" required type="number" inputMode="decimal" placeholder="38" error={errors.chest_inches?.message} {...register('chest_inches')} />
          <MeasurementGuide type="chest" />
        </div>
        <div>
          <Input label="Hips (inches)" required type="number" inputMode="decimal" placeholder="37" error={errors.hip_inches?.message} {...register('hip_inches')} />
          <MeasurementGuide type="hip" />
        </div>
        <div>
          <Input label="Thigh (inches)" required type="number" inputMode="decimal" placeholder="22" error={errors.thigh_inches?.message} {...register('thigh_inches')} />
          <MeasurementGuide type="thigh" />
        </div>
        <Input label="Trouser / jeans waist size" type="text" placeholder="e.g. 34 or L" hint="The size you buy today" {...register('trouser_waist_size')} />
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