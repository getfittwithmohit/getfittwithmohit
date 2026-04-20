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

export function Step03LifeVision({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { life_vision: data.life_vision },
  })

  const onSubmit = (values: { life_vision: string }) => {
    updateData({ life_vision: values.life_vision })
    onNext()
  }

  return (
    <SectionCard
      section={3}
      total={9}
      title="If you achieved everything — how would your life actually be different?"
      subtitle="Close your eyes for a moment. Picture it. Not the number on the scale — the life."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-sm text-[#64748b] leading-relaxed italic">
          "What are you doing? Who's around you? How do you feel getting out of bed?
          What does a Tuesday morning look like? How do you carry yourself?"
        </p>
      </div>

      <Textarea
        label="Describe the life you're actually building — not the goals, the life."
        hint="Be as vivid and specific as possible. This becomes the vision Coach Mohit returns to."
        placeholder="e.g. I'd wake up energised. I wouldn't dread looking in the mirror. I'd play sport with my kids without getting breathless. I'd walk into a room feeling like I belong there. I'd stop hiding in photos..."
        rows={5}
        {...register('life_vision')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}