'use client'

import { useRef } from 'react'
import { useOnboardingStore } from '@/store/onboardingStore'
import { SectionCard, NavButtons } from '@/components/ui'

interface Props {
  onNext: () => void
  onBack: () => void
}

function PhotoUpload({
  label,
  hint,
}: {
  label: string
  hint: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#64748b]">
        {label}
        <span className="text-[#94a3b8] ml-1 font-normal">(optional)</span>
      </label>
      <p className="text-xs text-[#94a3b8]">{hint}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-[#e2e8f0] rounded-lg p-6 text-center cursor-pointer hover:border-[#00d4d4] transition-colors duration-150"
      >
        <div className="text-2xl text-[#00d4d4] mb-1">+</div>
        <p className="text-xs text-[#94a3b8]">Tap to upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  )
}

export function Step10Photos({ onNext, onBack }: Props) {
  return (
    <SectionCard
      section={10}
      title="Progress Photos"
      subtitle="Optional but powerful. Your Week 0 photos become the most motivating thing you'll see at Week 12."
    >
      <div className="bg-[#f8fafc] rounded-lg p-4 text-sm text-[#64748b] leading-relaxed">
        Photos are <strong className="text-[#0f172a]">private</strong> — only visible to you and Coach Mohit.
        You can skip this now and WhatsApp your photos directly to Coach Mohit at any time.
      </div>

      <PhotoUpload
        label="Front photo"
        hint="Stand straight, arms at sides, facing the camera"
      />

      <PhotoUpload
        label="Side photo"
        hint="Stand straight, arms at sides, facing left"
      />

      <PhotoUpload
        label="Back photo"
        hint="Stand straight, arms at sides, facing away from camera"
      />

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue →"
      />
    </SectionCard>
  )
}