'use client'

import { useRef } from 'react'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  RadioGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import { BLOOD_WORK_STATUS } from '@/lib/constants/options'
import { useState } from 'react'

interface Props {
  onNext: () => void
  onBack: () => void
}

const RECOMMENDED_TESTS = [
  'CBC (Complete Blood Count)',
  'Thyroid — TSH, T3, T4',
  'Fasting Blood Sugar & HbA1c',
  'Lipid Profile',
  'Vitamin D3',
  'Vitamin B12',
  'Iron & Ferritin',
  'Cortisol (Morning)',
  'Testosterone (men)',
  'Oestrogen & Progesterone (women)',
  'CRP (C-Reactive Protein)',
]

export function Step11BloodWork({ onNext, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [bloodStatus, setBloodStatus] = useState('')

  return (
    <SectionCard
      section={11}
      title="Blood Work"
      subtitle="Strongly recommended but not mandatory. Blood reports allow Coach Mohit to design a programme that works with your body's actual biology — not guesswork."
    >
      {/* Recommended tests */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
        <p className="text-xs font-medium text-[#0f172a] mb-3">
          Recommended tests
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {RECOMMENDED_TESTS.map((test) => (
            <p key={test} className="text-xs text-[#64748b] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#00d4d4] flex-shrink-0" />
              {test}
            </p>
          ))}
        </div>
        <p className="text-xs text-[#94a3b8] mt-3">
          Get tested at any lab — Thyrocare, 1mg, SRL, or your local diagnostic centre.
        </p>
      </div>

      {/* Blood work status */}
      <RadioGroup
        label="Have you had blood work done recently?"
        options={BLOOD_WORK_STATUS}
        value={bloodStatus}
        onChange={setBloodStatus}
      />

      {/* Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#64748b]">
          Upload blood report
          <span className="text-[#94a3b8] ml-1 font-normal">(optional)</span>
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          className="border border-dashed border-[#e2e8f0] rounded-lg p-6 text-center cursor-pointer hover:border-[#00d4d4] transition-colors duration-150"
        >
          <div className="text-2xl text-[#00d4d4] mb-1">+</div>
          <p className="text-xs text-[#94a3b8]">PDF or image — tap to upload</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
          />
        </div>
        <p className="text-xs text-[#94a3b8]">
          You can also WhatsApp your report to Coach Mohit at any time.
        </p>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Submit Profile →"
      />
    </SectionCard>
  )
}