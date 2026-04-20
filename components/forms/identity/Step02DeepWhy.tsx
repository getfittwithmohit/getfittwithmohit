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

export function Step02DeepWhy({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { deep_why: data.deep_why },
  })

  const onSubmit = (values: { deep_why: string }) => {
    updateData({ deep_why: values.deep_why })
    onNext()
  }

  return (
    <SectionCard
      section={2}
      total={9}
      title="But why does that matter to you?"
      subtitle="Most people stop at the surface. Keep asking why — the real reason is usually 3–4 layers deeper."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-1">
          The 5 Whys — Simon Sinek
        </p>
        <p className="text-sm text-[#64748b] leading-relaxed">
          "I want to lose weight." — But why? "To look better." — But why does that matter?
          Keep asking. The real reason is rarely about the body. It's about how you want
          to <strong className="text-[#0f172a]">feel</strong>, how you want to
          <strong className="text-[#0f172a]"> show up</strong>, what you want your
          <strong className="text-[#0f172a]"> life to look like</strong>.
        </p>
      </div>

      <Textarea
        label="Why does changing your body actually matter to you?"
        hint="Don't rush this. Sit with it. The answer that makes you emotional is the real one."
        placeholder="e.g. Because I want to feel confident again. Because I'm tired of feeling exhausted by 3pm. Because I want to be present for my kids without getting breathless..."
        rows={5}
        {...register('deep_why')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}