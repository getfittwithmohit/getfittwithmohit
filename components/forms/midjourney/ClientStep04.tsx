'use client'

import { useRef } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function ClientStep04({ onNext, onBack }: Props) {
  const { updateClient } = useMidJourneyStore()
  const anythingElseRef = useRef<HTMLTextAreaElement>(null)

  const handleNext = () => {
    updateClient({
      anything_else: anythingElseRef.current?.value || '',
    })
    onNext()
  }

  return (
    <SectionCard
      section={4}
      total={4}
      title="Purpose & Identity"
      subtitle="The final piece — and the most powerful one."
    >
      {/* What they'll create */}
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-2 uppercase tracking-wide">
          What you'll create next
        </p>
        <p className="text-sm font-medium text-[#0f172a] mb-1">
          Your personal Identity Card
        </p>
        <p className="text-sm text-[#64748b] leading-relaxed mb-3">
          A card that captures your deep WHY, who you are becoming,
          the values that guide you, and the commitment you're making
          to yourself. Coach Mohit will use this every time you need
          a reminder of why you started.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Your WHY',
            'Identity Statement',
            'Core Values',
            'Personal Commitment',
          ].map((item) => (
            <span
              key={item}
              className="text-xs bg-[#1a1f3a] text-[#00d4d4] px-2.5 py-1 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Duration note */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
        <p className="text-sm text-[#64748b] leading-relaxed">
          <strong className="text-[#0f172a]">Takes 8–10 minutes.</strong>{' '}
          9 guided questions that go from your surface goal to your deepest
          reason — and end with a personal commitment to yourself.
          Most clients say this is the most powerful thing they've done
          in the programme.
        </p>
      </div>

      {/* Anything else */}
      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          Before you go — anything else Coach Mohit should know?
        </label>
        <textarea
          ref={anythingElseRef}
          placeholder="Anything at all — personal, professional, physical or mental..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <NavButtons
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Submit & Open Identity Form"
      />
    </SectionCard>
  )
}