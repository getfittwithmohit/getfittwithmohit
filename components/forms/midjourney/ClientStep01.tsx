'use client'

import { useRef } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { useState } from 'react'

interface Props {
  onNext: () => void
}

export function ClientStep01({ onNext }: Props) {
  const { coach, client, updateClient } = useMidJourneyStore()
  const [howFeeling, setHowFeeling] = useState(client.how_feeling)

  const weightRef = useRef<HTMLInputElement>(null)
  const waistRef = useRef<HTMLInputElement>(null)

  const firstName = coach.full_name.split(' ')[0] || 'there'

  const handleNext = () => {
    updateClient({
      confirmed_weight: weightRef.current?.value || '',
      waist_inches: waistRef.current?.value || '',
      how_feeling: howFeeling,
    })
    onNext()
  }

  return (
    <SectionCard
      section={1}
      total={4}
      title={`Welcome to the new system, ${firstName} 👋`}
      subtitle="Coach Mohit has upgraded his coaching system. This takes 15 minutes — and it will make your sessions significantly more personalised."
    >
      {/* What coach already has */}
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-2">
          What Coach Mohit already has
        </p>
        <p className="text-sm text-[#64748b] leading-relaxed">
          Your start date, current week, phase, weight history and progress notes.
          You don't need to repeat any of that.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            `Week ${coach.current_week}`,
            coach.phase,
            `${coach.current_weight} kg`,
          ].filter(Boolean).map((item) => (
            <span
              key={item}
              className="text-xs bg-[#1a1f3a] text-[#00d4d4] px-2.5 py-1 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Confirm weight */}
      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          Confirm your current weight (kg)
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </label>
        <input
          ref={weightRef}
          type="number"
          defaultValue={client.confirmed_weight}
          placeholder="e.g. 83.2"
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          Waist measurement (inches)
        </label>
        <input
          ref={waistRef}
          type="number"
          defaultValue={client.waist_inches}
          placeholder="e.g. 33"
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
        />
      </div>

      <RadioGroup
        label="How are you feeling overall right now?"
        options={['Struggling', 'Getting by', 'Good', 'Great']}
        value={howFeeling}
        onChange={setHowFeeling}
      />

      <NavButtons onNext={handleNext} />
    </SectionCard>
  )
}