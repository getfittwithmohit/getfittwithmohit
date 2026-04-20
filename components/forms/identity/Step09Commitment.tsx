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

export function Step09Commitment({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { personal_commitment: data.personal_commitment },
  })

  const onSubmit = (values: { personal_commitment: string }) => {
    updateData({ personal_commitment: values.personal_commitment })
    onNext()
  }

  return (
    <SectionCard
      section={9}
      total={9}
      title="Make one commitment to yourself — right now."
      subtitle="Not to Coach Mohit. Not to your family. To yourself. One thing you will do differently from today."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-sm text-[#64748b] leading-relaxed">
          Keep it <strong className="text-[#0f172a]">specific</strong> and keep it
          <strong className="text-[#0f172a]"> real</strong>. Not "I will be healthier."
          Something you can actually measure — something that, if you did it every day
          for 30 days, would change everything.
        </p>
      </div>

      {/* Prefix */}
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Your commitment
        </p>
        <div className="mb-2">
          <span className="text-sm font-medium text-[#00d4d4]">
            I commit to...
          </span>
        </div>
        <Textarea
          placeholder="e.g. showing up for my health even when I don't feel like it — because the person I want to become does the work regardless of how they feel. I commit to completing every check-in, every week, no matter what."
          rows={4}
          {...register('personal_commitment')}
        />
      </div>

      <NavButtons
        onBack={onBack}
        onNext={handleSubmit(onSubmit)}
        nextLabel="Generate my Identity Card →"
      />
    </SectionCard>
  )
}