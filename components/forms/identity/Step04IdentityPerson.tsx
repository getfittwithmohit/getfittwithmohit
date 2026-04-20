'use client'

import { useForm } from 'react-hook-form'
import { useIdentityStore } from '@/store/identityStore'
import { Textarea } from '@/components/ui/Textarea'
import { NavButtons } from '@/components/ui/NavButtons'
import { SectionCard } from '@/components/ui/SectionCard'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function Step04IdentityPerson({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { identity_person: data.identity_person },
  })

  const onSubmit = (values: { identity_person: string }) => {
    updateData({ identity_person: values.identity_person })
    onNext()
  }

  return (
    <SectionCard
      section={4}
      total={9}
      title="Who is the person who lives that life?"
      subtitle="Not goals. Not outcomes. Who are they? How do they think? How do they treat their body?"
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-1">
          Phase 2 — Identity · James Clear
        </p>
        <p className="text-sm text-[#64748b] leading-relaxed">
          "Every action you take is a vote for the type of person you want to become."
          The goal isn't to lose 15kg. The goal is to become the kind of person who
          takes care of their body — <strong className="text-[#0f172a]">consistently,
          not perfectly.</strong>
        </p>
      </div>

      <Textarea
        label="Describe this person. Who are they becoming?"
        hint="Write in the third person — describe them like you'd describe someone you deeply admire."
        placeholder="e.g. They are disciplined but not obsessive. They move their body because they love it, not to punish it. They plan their meals but don't panic when life happens. They show up even when they don't feel like it. They are someone who keeps their promises to themselves..."
        rows={5}
        {...register('identity_person')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}