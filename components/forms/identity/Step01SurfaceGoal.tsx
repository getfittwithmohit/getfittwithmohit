'use client'

import { useForm } from 'react-hook-form'
import { useIdentityStore } from '@/store/identityStore'
import { Textarea } from '@/components/ui/Textarea'
import { NavButtons } from '@/components/ui/NavButtons'
import { SectionCard } from '@/components/ui/SectionCard'

interface Props {
  onNext: () => void
}

export function Step01SurfaceGoal({ onNext }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { surface_goal: data.surface_goal },
  })

  const onSubmit = (values: { surface_goal: string }) => {
    updateData({ surface_goal: values.surface_goal })
    onNext()
  }

  return (
    <SectionCard
      section={1}
      total={9}
      title="What do you want to change?"
      subtitle="Start here. No pressure to go deep yet — just say what's on the surface."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4 text-sm text-[#64748b] leading-relaxed">
        <span className="text-[#00d4d4] font-medium">Phase 1 — Reflect. </span>
        This is a guided conversation with yourself — not a questionnaire. Take your time with each question.
      </div>

      <Textarea
        label="What do you want to change about your body or health?"
        hint="Start with what's on the surface. We'll go deeper together."
        placeholder="e.g. I want to lose 15kg, get fitter, have more energy throughout the day..."
        rows={4}
        {...register('surface_goal')}
      />

      <NavButtons onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}