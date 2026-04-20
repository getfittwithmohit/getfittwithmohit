'use client'

import { useRef, useState } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { SLEEP_DURATION } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function ClientStep02({ onNext, onBack }: Props) {
  const { client, updateClient } = useMidJourneyStore()

  const [sleepDuration, setSleepDuration] = useState(client.sleep_duration)
  const [stressLevel, setStressLevel] = useState(client.stress_level)
  const [nutritionAdherence, setNutritionAdherence] = useState(
    client.nutrition_adherence
  )
  const [workoutConsistency, setWorkoutConsistency] = useState(
    client.workout_consistency
  )

  const lifeChangesRef = useRef<HTMLTextAreaElement>(null)

  const handleNext = () => {
    updateClient({
      sleep_duration: sleepDuration,
      stress_level: stressLevel,
      life_changes: lifeChangesRef.current?.value || '',
      nutrition_adherence: nutritionAdherence,
      workout_consistency: workoutConsistency,
    })
    onNext()
  }

  return (
    <SectionCard
      section={2}
      total={4}
      title="Lifestyle Snapshot"
      subtitle="Things change. Coach Mohit needs to know where you actually are today — not where you were when you started."
    >
      <RadioGroup
        label="Sleep — average this week"
        options={SLEEP_DURATION}
        value={sleepDuration}
        onChange={setSleepDuration}
      />

      <ScaleSelect
        label="Stress level right now"
        value={stressLevel}
        onChange={setStressLevel}
        lowLabel="Very low"
        highLabel="Extremely high"
      />

      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          Has anything changed in your life since you started with Coach Mohit?
        </label>
        <textarea
          ref={lifeChangesRef}
          defaultValue={client.life_changes}
          placeholder="e.g. new job, moved city, relationship change, health issue, travel schedule changed..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <RadioGroup
        label="Nutrition — how closely are you following your plan right now?"
        options={['Struggling', 'Partially', 'Mostly', 'Fully on plan']}
        value={nutritionAdherence}
        onChange={setNutritionAdherence}
      />

      <RadioGroup
        label="Workout consistency lately"
        options={[
          'Barely showing up',
          'Hit or miss',
          'Mostly consistent',
          'Very consistent',
        ]}
        value={workoutConsistency}
        onChange={setWorkoutConsistency}
      />

      <NavButtons onBack={onBack} onNext={handleNext} />
    </SectionCard>
  )
}