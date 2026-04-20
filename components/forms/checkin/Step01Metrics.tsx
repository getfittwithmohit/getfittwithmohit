'use client'

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
  const isNeutral = diff !== null && parseFloat(diff) === 0

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0] last:border-0">
      <span className="text-xs text-[#64748b]">{label}</span>
      <div className="flex items-center gap-2">
        {previous && (
          <span className="text-xs text-[#94a3b8]">{previous} {unit}</span>
        )}
        {previous && (
          <span className="text-xs text-[#94a3b8]">→</span>
        )}
        <span className="text-xs font-medium text-[#0f172a]">
          {current || '?'} {current ? unit : ''}
        </span>
        {diff !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive
              ? 'bg-emerald-50 text-emerald-600'
              : isNegative
                ? 'bg-red-50 text-red-500'
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

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      weight_kg: data.weight_kg,
      waist_inches: data.waist_inches,
      chest_inches: data.chest_inches,
      hip_inches: data.hip_inches,
      other_measurement: data.other_measurement,
    },
  })

  const weightVal = watch('weight_kg')
  const waistVal = watch('waist_inches')

  const onSubmit = (values: any) => {
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
      {/* vs last week preview */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          vs Last Week
        </p>
        <MetricRow
          label="Weight"
          current={weightVal}
          previous="–"
          unit="kg"
        />
        <MetricRow
          label="Waist"
          current={waistVal}
          previous="–"
          unit="in"
        />
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Weight (kg)"
          required
          type="number"
          placeholder="e.g. 78.8"
          {...register('weight_kg')}
        />
        <Input
          label="Waist (inches)"
          type="number"
          placeholder="e.g. 32.5"
          {...register('waist_inches')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Chest (inches)"
          type="number"
          placeholder="e.g. 37"
          {...register('chest_inches')}
        />
        <Input
          label="Hip (inches)"
          type="number"
          placeholder="e.g. 36"
          {...register('hip_inches')}
        />
      </div>

      <Input
        label="Any other measurement"
        placeholder="e.g. thigh 22 inches, arm 14 inches..."
        {...register('other_measurement')}
      />

      <NavButtons onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}