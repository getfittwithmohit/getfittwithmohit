'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCheckinStore } from '@/store/checkinStore'
import { Textarea } from '@/components/ui/Textarea'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { WIN_OPTIONS, CHALLENGE_OPTIONS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step04Wins({ onNext, onBack }: Props) {
  const { data, updateData } = useCheckinStore()

  const [wins, setWins] = useState<string[]>(data.wins || [])
  const [challenges, setChallenges] = useState<string[]>(data.challenges || [])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      wins_description: data.wins_description,
      challenges_description: data.challenges_description,
      real_life_context: data.real_life_context,
    },
  })

  const toggleWin = (val: string) => {
    setWins((prev) =>
      prev.includes(val) ? prev.filter((w) => w !== val) : [...prev, val]
    )
  }

  const toggleChallenge = (val: string) => {
    setChallenges((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    )
  }

  const onSubmit = (values: any) => {
    updateData({ ...values, wins, challenges })
    onNext()
  }

  return (
    <SectionCard
      section={4}
      total={6}
      title="Wins & Challenges"
      subtitle="This is where Coach Mohit gets to know you beyond the numbers. Be real."
    >
      {/* Wins */}
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-1">
          Biggest wins this week
          <span className="text-[#94a3b8] ml-1 font-normal">
            — no win is too small
          </span>
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {WIN_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleWin(opt)}
              className={`
                px-3 py-1.5 rounded-full text-xs border
                transition-all duration-150
                ${wins.includes(opt)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-emerald-300'
                }
              `}
            >
              {wins.includes(opt) ? '✓ ' : ''}{opt}
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Describe your biggest win this week in your own words..."
          rows={2}
          {...register('wins_description')}
        />
      </div>

      {/* Challenges */}
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-1">
          Biggest challenges this week
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CHALLENGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleChallenge(opt)}
              className={`
                px-3 py-1.5 rounded-full text-xs border
                transition-all duration-150
                ${challenges.includes(opt)
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-red-200'
                }
              `}
            >
              {challenges.includes(opt) ? '✗ ' : ''}{opt}
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Tell Coach Mohit what got in the way this week..."
          rows={2}
          {...register('challenges_description')}
        />
      </div>

      {/* Real life context */}
      <Textarea
        label="Any real-life situations Coach Mohit should know about for next week?"
        placeholder="e.g. travelling for work, family event, late nights, exam stress, wedding..."
        {...register('real_life_context')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}