'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { Input } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'

interface Props {
  onNext: () => void
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
      <span className="text-xs text-[#64748b]">{label}</span>
      <div className="flex items-center gap-2">
        {previous && <span className="text-xs text-[#94a3b8]">{previous} {unit}</span>}
        {previous && <span className="text-xs text-[#94a3b8]">→</span>}
        <span className="text-xs font-medium text-[#0f172a]">
          {current || '?'} {current ? unit : ''}
        </span>
        {diff !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive ? 'bg-emerald-50 text-emerald-600'
            : isNegative ? 'bg-red-50 text-red-500'
            : 'bg-[#f8fafc] text-[#94a3b8]'
          }`}>
            {isPositive ? '▼' : isNegative ? '▲' : '='} {Math.abs(parseFloat(diff))} {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export function Step01Metrics({ onNext }: Props) {
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
    },
  })

  const weightVal = watch('weight_kg')
  const waistVal = watch('waist_inches')

  const onSubmit = (values: any) => {
    if (!values.weight_kg) {
      setError('Please enter your weight — it is required every week.')
      return
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
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">vs Last Week</p>
        <MetricRow label="Weight" current={weightVal} previous="–" unit="kg" />
        <MetricRow label="Waist" current={waistVal} previous="–" unit="in" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Weight (kg)" required type="number" placeholder="e.g. 78.8" {...register('weight_kg')} />
        <Input label="Waist (inches)" type="number" placeholder="e.g. 32.5" {...register('waist_inches')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Chest (inches)" type="number" placeholder="e.g. 37" {...register('chest_inches')} />
        <Input label="Hip (inches)" type="number" placeholder="e.g. 36" {...register('hip_inches')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Lower belly (inches)" type="number" placeholder="e.g. 35" {...register('lower_belly_inches')} />
        <Input label="Thigh (inches)" type="number" placeholder="e.g. 22" {...register('thigh_inches')} />
      </div>
      <Input label="Daily steps this week (average)" type="number" placeholder="e.g. 7500" {...register('daily_steps')} />
      <Input label="Any health issues this week?" placeholder="e.g. back pain, headache..." {...register('health_issues')} />
      <Input label="Any other measurement" placeholder="e.g. arm 14 inches..." {...register('other_measurement')} />

      {error && (
        <p className="text-xs text-[#ef4444] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <NavButtons onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}