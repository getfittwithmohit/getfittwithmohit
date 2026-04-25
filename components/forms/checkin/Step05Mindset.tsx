'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckinStore } from '@/store/checkinStore'
import { Textarea } from '@/components/ui/Textarea'
import { ScaleSelect } from '@/components/ui/ScaleSelect'
import { CheckGroup } from '@/components/ui/CheckGroup'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { MINDSET_QUESTIONS, COACH_NEEDS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step05Mindset({ onNext, onBack }: Props) {
  const { data, updateData } = useCheckinStore()
  const [error, setError] = useState('')

  const [mindsetQuestion, setMindsetQuestion] = useState('')
  const [needsFromCoach, setNeedsFromCoach] = useState<string[]>(
    data.needs_from_coach || []
  )

  useEffect(() => {
    const weekIndex = new Date().getDay()
    setMindsetQuestion(MINDSET_QUESTIONS[weekIndex % MINDSET_QUESTIONS.length])
  }, [])

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      mindset_answer: data.mindset_answer,
      why_connection: data.why_connection,
      needs_description: data.needs_description,
      week_rating: data.week_rating,
    },
  })

  const whyConnection = watch('why_connection')
  const weekRating = watch('week_rating')

  const toggleNeed = (val: string) => {
    setNeedsFromCoach((prev) =>
      prev.includes(val) ? prev.filter((n) => n !== val) : [...prev, val]
    )
    setError('')
  }

  const onSubmit = (values: any) => {
    if (needsFromCoach.length === 0) {
      setError('Please select at least one thing you need from Coach Mohit.')
      return
    }
    if (!weekRating) {
      setError('Please rate your overall week.')
      return
    }
    setError('')
    updateData({
      ...values,
      why_connection: whyConnection,
      week_rating: weekRating,
      needs_from_coach: needsFromCoach,
    })
    onNext()
  }

  return (
    <SectionCard
      section={5}
      total={6}
      title="How are you doing on the inside?"
      subtitle="Physical results follow mental state. Coach Mohit coaches the whole person — not just the body."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-1 uppercase tracking-wide">
          This week's mindset question
        </p>
        <p className="text-sm font-medium text-[#0f172a] leading-relaxed">
          {mindsetQuestion}
        </p>
      </div>

      <Textarea
        label="Your answer"
        hint="Take a moment. Answer honestly."
        placeholder="..."
        rows={4}
        {...register('mindset_answer')}
      />

      <ScaleSelect
        label="How connected do you feel to your WHY this week?"
        value={whyConnection}
        onChange={(v) => { setValue('why_connection', v); setError('') }}
        lowLabel="Completely disconnected"
        highLabel="Burning strong"
      />

      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          What do you need from Coach Mohit in this week's call?
          <span className="text-[#00d4d4] ml-0.5">*</span>
        </p>
        <CheckGroup
          options={COACH_NEEDS}
          values={needsFromCoach}
          onChange={toggleNeed}
        />
      </div>

      <Textarea
        label="Anything specific you want to discuss on the call?"
        hint="The more specific, the more useful the call will be."
        placeholder="e.g. I want to talk about adjusting my meal plan..."
        {...register('needs_description')}
      />

      <ScaleSelect
        label="Overall — how would you rate this week?"
        required
        value={weekRating}
        onChange={(v) => { setValue('week_rating', v); setError('') }}
        lowLabel="Tough week"
        highLabel="Best week yet"
      />

      {error && (
        <p className="text-xs text-[#ef4444] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={() => handleSubmit(onSubmit)()} />
    </SectionCard>
  )
}