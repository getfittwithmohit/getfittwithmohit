'use client'

import { useRef, useState } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function ClientStep03({ onNext, onBack }: Props) {
  const { client, updateClient } = useMidJourneyStore()
  const [commitmentScore, setCommitmentScore] = useState(
    client.commitment_score
  )

  const biggestChallengeRef = useRef<HTMLTextAreaElement>(null)
  const whatMissingRef = useRef<HTMLTextAreaElement>(null)
  const whatWorkedRef = useRef<HTMLTextAreaElement>(null)
  const next4WeeksRef = useRef<HTMLTextAreaElement>(null)

  const handleNext = () => {
    updateClient({
      biggest_challenge: biggestChallengeRef.current?.value || '',
      what_missing: whatMissingRef.current?.value || '',
      what_worked: whatWorkedRef.current?.value || '',
      commitment_score: commitmentScore,
      next_4_weeks: next4WeeksRef.current?.value || '',
    })
    onNext()
  }

  return (
    <SectionCard
      section={3}
      total={4}
      title="Honest Reflection"
      subtitle="Coach Mohit can only fix what he knows about. Be honest — there is no judgment here."
    >
      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          What has been your biggest challenge working with Coach Mohit so far?
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </label>
        <textarea
          ref={biggestChallengeRef}
          defaultValue={client.biggest_challenge}
          placeholder="e.g. I keep falling off during travel weeks. I find it hard to say no at social events..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          What do you feel is currently missing from your programme?
        </label>
        <textarea
          ref={whatMissingRef}
          defaultValue={client.what_missing}
          placeholder="e.g. More accountability, clearer meal plan, harder workouts, more flexibility..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          What has worked really well — that you want to keep?
        </label>
        <textarea
          ref={whatWorkedRef}
          defaultValue={client.what_worked}
          placeholder="e.g. The check-ins keep me accountable. Home workouts fit my schedule better..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <ScaleSelect
        label="On a scale of 1–10 — how committed are you to this journey right now?"
        value={commitmentScore}
        onChange={setCommitmentScore}
        lowLabel="Wavering"
        highLabel="Fully in"
      />

      <div>
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          What would make the next 4 weeks significantly better than the last 4?
        </label>
        <textarea
          ref={next4WeeksRef}
          defaultValue={client.next_4_weeks}
          placeholder="Be specific — this goes directly to Coach Mohit to adjust your plan..."
          rows={3}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} />
    </SectionCard>
  )
}