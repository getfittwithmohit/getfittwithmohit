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

export function Step06Obstacle({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { obstacle: data.obstacle },
  })

  const onSubmit = (values: { obstacle: string }) => {
    updateData({ obstacle: values.obstacle })
    onNext()
  }

  return (
    <SectionCard
      section={6}
      total={9}
      title="What has stopped you before — and what are you willing to do differently this time?"
      subtitle="This is the most honest question. Not what went wrong — but what YOU are willing to change."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-sm text-[#64748b] leading-relaxed">
          The programme can be perfect — but it only works if you show up
          differently. Coach Mohit needs to know what you're
          <strong className="text-[#0f172a]"> actually willing to change </strong>
          — not just what you hope to change.
        </p>
      </div>

      <Textarea
        label="What has stopped you before — and what are you willing to do differently?"
        hint="Be brutally honest. This is private and it's the most important thing you can share."
        placeholder="e.g. I've always quit when results slowed down. This time I'm willing to trust the process even when I can't see the change. I'm willing to ask for help instead of figuring it out alone. I'm willing to be consistent even when I don't feel motivated..."
        rows={5}
        {...register('obstacle')}
      />

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}