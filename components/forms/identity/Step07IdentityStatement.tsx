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

export function Step07IdentityStatement({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()

  const { register, handleSubmit } = useForm({
    defaultValues: { identity_statement: data.identity_statement },
  })

  const onSubmit = (values: { identity_statement: string }) => {
    updateData({ identity_statement: values.identity_statement })
    onNext()
  }

  return (
    <SectionCard
      section={7}
      total={9}
      title="Complete this sentence — and mean it."
      subtitle="Goals are outcomes. Identity is who you are. When things get hard, your identity answers the question."
    >
      <div className="bg-gradient-to-br from-[#00d4d4]/5 to-[#4a7fd4]/5 border border-[#00d4d4]/15 rounded-xl p-4">
        <p className="text-xs font-medium text-[#00d4d4] mb-1">
          Phase 3 — Commitment
        </p>
        <p className="text-sm text-[#64748b] leading-relaxed">
          When things get hard — and they will — you won't ask
          "do I feel like working out?" You'll ask
          <strong className="text-[#0f172a]"> "what would a person like me do?"</strong>
          Your identity statement is the answer.
        </p>
      </div>

      {/* Prefix */}
      <div>
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Complete this sentence
        </p>
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-[#00d4d4] mt-2.5 flex-shrink-0">
            I am someone who...
          </span>
        </div>
        <Textarea
          placeholder="e.g. prioritises their health even on difficult days. Moves their body consistently. Fuels themselves well. Shows up for themselves the way they show up for everyone else."
          rows={4}
          {...register('identity_statement')}
        />
      </div>

      <NavButtons onBack={onBack} onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}