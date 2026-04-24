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
      title="Review & Book Your Call"
      subtitle="Your check-in is ready. Coach Mohit will review it before your call — so you hit the ground running."
    >
      {/* Summary bars */}
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

      {/* Book call */}
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-5 text-center">
        <div className="text-3xl mb-3">📅</div>
        <h4 className="text-base font-medium text-[#0f172a] mb-2">
          Book Your Weekly Review Call
        </h4>
        <p className="text-sm text-[#64748b] leading-relaxed mb-4">
          Choose a slot with Coach Mohit this weekend.
          He'll have reviewed your check-in before the call.
        </p>

        {/* Day buttons */}
        <div className="flex gap-3 justify-center mb-4">
          {['Saturday', 'Sunday'].map((day) => (
            <div
              key={day}
              className="bg-[#1a1f3a] rounded-xl px-6 py-3 text-center"
            >
              <p className="text-[#00d4d4] text-sm font-medium">{day}</p>
              <p className="text-white/40 text-xs mt-0.5">Slots available</p>
            </div>
          ))}
        </div>

        {/* cal.com button */}
        
         <button
          type="button"
          onClick={() => window.open('https://cal.com/fittnesscoach/weekly-review-call-for-1-1-clients-only?overlayCalendar=true', '_blank')}
          className="inline-block bg-[#00d4d4] text-[#1a1f3a] px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
        >
          Open Booking Calendar
        </button>
        <p className="text-xs text-[#94a3b8] mt-2">
          Coach Mohit is available Saturday & Sunday only
        </p>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel={submitting ? 'Submitting...' : 'Submit Check-In →'}
        loading={submitting}
      />
    </SectionCard>
  )
}