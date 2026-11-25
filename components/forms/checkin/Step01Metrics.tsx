'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { Input } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { MeasurementGuide } from '@/components/ui/MeasurementGuide'

interface Props {
  onNext: () => void
  // Photo week (every 4 weeks): all five measurements are required
  fullMeasure?: boolean
  previous?: { weight_kg?: number | null; waist_inches?: number | null }
}

interface MetricRowProps {
  label: string
  current: string
  previous: string
  unit: string
}

function MetricRow({ label, current, previous, unit }: MetricRowProps) {
  const curr = parseFloat(current)
  const prev = parseFloat(previous)
  const hasValues = !isNaN(curr) && !isNaN(prev) && previous !== ''
  const diff = hasValues ? (curr - prev).toFixed(1) : null
  const isPositive = diff !== null && parseFloat(diff) < 0
  const isNegative = diff !== null && parseFloat(diff) > 0

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0] last:border-0">
      <span className="text-sm text-[#64748b]">{label}</span>
      <div className="flex items-center gap-2">
        {previous && <span className="text-sm text-[#64748b]">{previous} {unit}</span>}
        {previous && <span className="text-sm text-[#64748b]">→</span>}
        <span className="text-sm font-medium text-[#0f172a]">
          {current || '?'} {current ? unit : ''}
        </span>
        {diff !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive ? 'bg-emerald-50 text-emerald-600'
            : isNegative ? 'bg-red-50 text-red-500'
            : 'bg-[#f8fafc] text-[#64748b]'
          }`}>
            {isPositive ? '▼' : isNegative ? '▲' : '='} {Math.abs(parseFloat(diff))} {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export function Step01Metrics({ onNext, fullMeasure = false, previous }: Props) {
  const { data, updateData } = useCheckinStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      weight_kg: data.weight_kg,
      waist_inches: data.waist_inches,
      chest_inches: data.chest_inches,
      hip_inches: data.hip_inches,
      other_measurement: data.other_measurement,
      lower_belly_inches: data.lower_belly_inches,
      thigh_inches: data.thigh_inches,
      daily_steps: data.daily_steps,
      health_issues: data.health_issues,
      trouser_waist_size: data.trouser_waist_size || '',
    },
  })

  const weightVal = watch('weight_kg')
  const waistVal = watch('waist_inches')

  const onSubmit = (values: any) => {
    if (!values.weight_kg) {
      setError('Please enter your weight — it is required every week.')
      return
    }
    if (!values.waist_inches) {
      setError('Please enter your waist — it is required every week.')
      return
    }
    if (fullMeasure) {
      const missing = [
        ['chest_inches', 'chest'], ['hip_inches', 'hips'], ['lower_belly_inches', 'lower belly'], ['thigh_inches', 'thigh'],
      ].filter(([k]) => !values[k]).map(([, label]) => label)
      if (missing.length) {
        setError(`It’s measurement week — please add your ${missing.join(', ')}.`)
        return
      }
    }
    setError('')
    updateData(values)
    onNext()
  }

  return (
    <SectionCard
      section={1}
      total={6}
      title="Body Metrics"
      subtitle="Weigh yourself first thing in the morning — same time, same conditions every week."
    >
      <div className="bg-[#F7F9FB] rounded-2xl p-4">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-3">vs Last Week</p>
        <MetricRow label="Weight" current={weightVal} previous={previous?.weight_kg != null ? String(previous.weight_kg) : ''} unit="kg" />
        <MetricRow label="Waist" current={waistVal} previous={previous?.waist_inches != null ? String(previous.waist_inches) : ''} unit="in" />
      </div>

      {fullMeasure && (
        <div className="bg-[#E6F7F9] rounded-2xl px-4 py-3 text-[15px] text-[#0f172a] leading-relaxed">
          <strong>Measurement week.</strong> Please measure all five places today — this is what your inches-lost is based on.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Weight (kg)" required type="number" inputMode="decimal" placeholder="e.g. 78.8" {...register('weight_kg')} />
          <MeasurementGuide type="weight" />
        </div>
        <div>
          <Input label="Waist (inches)" required type="number" inputMode="decimal" placeholder="e.g. 32.5" {...register('waist_inches')} />
          <MeasurementGuide type="waist" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Chest (inches)" required={fullMeasure} type="number" inputMode="decimal" placeholder="e.g. 37" {...register('chest_inches')} />
          <MeasurementGuide type="chest" />
        </div>
        <div>
          <Input label="Hips (inches)" required={fullMeasure} type="number" inputMode="decimal" placeholder="e.g. 36" {...register('hip_inches')} />
          <MeasurementGuide type="hip" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Lower belly (inches)" required={fullMeasure} type="number" inputMode="decimal" placeholder="e.g. 35" {...register('lower_belly_inches')} />
          <MeasurementGuide type="belly" />
        </div>
        <div>
          <Input label="Thigh (inches)" required={fullMeasure} type="number" inputMode="decimal" placeholder="e.g. 22" {...register('thigh_inches')} />
          <MeasurementGuide type="thigh" />
        </div>
      </div>
      {fullMeasure && (
        <Input label="Trouser / jeans waist size" placeholder="e.g. 32 or M" hint="The size that fits you now" {...register('trouser_waist_size')} />
      )}
      <Input label="Daily steps this week (average)" type="number" inputMode="numeric" placeholder="e.g. 7500" {...register('daily_steps')} />
      <Input label="Any health issues this week?" placeholder="e.g. back pain, headache..." {...register('health_issues')} />
      <Input label="Any other measurement" placeholder="e.g. arm 14 inches..." {...register('other_measurement')} />

      {error && (
        <p className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <NavButtons onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}