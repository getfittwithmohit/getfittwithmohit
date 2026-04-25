'use client'

import { useCheckinStore } from '@/store/checkinStore'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'

interface Props {
  onNext: () => void
  onBack: () => void
  submitting: boolean
}

interface SummaryBarProps {
  label: string
  value: number
  max: number
  color: string
  display: string
}

function SummaryBar({ label, value, max, color, display }: SummaryBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#64748b]">{label}</span>
        <span className="font-medium text-[#0f172a]">{display}</span>
      </div>
      <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export function Step06BookCall({ onNext, onBack, submitting }: Props) {
  const { data } = useCheckinStore()

  const workouts = parseInt(data.workouts_completed) || 0
  const nutrition = parseInt(data.nutrition_adherence) || 0
  const energy = parseInt(data.energy_level) || 0

  return (
    <SectionCard
      section={6}
      total={6}
      title="Review & Submit"
      subtitle="Your check-in is ready. Coach Mohit will review everything before your call."
    >
      {/* Summary snapshot */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-3">
          This Week's Snapshot
        </p>
        <SummaryBar
          label="Workout adherence"
          value={workouts}
          max={6}
          color="#00d4d4"
          display={`${workouts}/6 workouts`}
        />
        <SummaryBar
          label="Nutrition adherence"
          value={nutrition}
          max={10}
          color="#4a7fd4"
          display={`${nutrition}/10`}
        />
        <SummaryBar
          label="Energy level"
          value={energy}
          max={10}
          color="#22c55e"
          display={`${energy}/10`}
        />
      </div>

      <p className="text-xs text-[#94a3b8] text-center leading-relaxed">
        Once submitted, you'll be asked to book your review call with Coach Mohit.
      </p>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel={submitting ? 'Submitting...' : 'Submit Check-In →'}
        loading={submitting}
      />
    </SectionCard>
  )
}