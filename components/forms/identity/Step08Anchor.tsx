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

export function Step08Anchor({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { reengagement_anchor: data.reengagement_anchor },
  })

  const onSubmit = (values: { reengagement_anchor: string }) => {
    updateData({ reengagement_anchor: values.reengagement_anchor })
    onNext()
  }

  return (
    <SectionCard
      section={8}
      total={9}
      title="If Coach Mohit reaches out during a quiet week — what do you want him to remind you of?"
      subtitle="Write this as a message to your future self. The version of you who is tired, overwhelmed, and thinking about giving up."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-sm text-[#64748b] leading-relaxed">
          Coach Mohit will use this exact message when you go quiet.
          Not a generic motivational quote — <strong className="text-[#0f172a]">
          your words, written by you, for you.
          </strong> The most powerful re-engagement tool there is.
        </p>
      </div>

      <Textarea
        label="What do you need to hear on your hardest days?"
        hint="Write it directly — as if you're leaving a voicemail for yourself."
        placeholder="e.g. Remind me why I started. Remind me that I've already proven I can push through hard days. Tell me that I'm not doing this to be perfect — I'm doing this to be better. Tell me that every time I've shown up, even imperfectly, it has counted..."
        rows={5}
        {...register('reengagement_anchor')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}