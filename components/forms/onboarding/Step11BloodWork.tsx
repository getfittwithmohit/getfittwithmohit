'use client'

import { useRef, useState } from 'react'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { BLOOD_WORK_STATUS } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
  onBloodWorkFile: (file: File | null) => void
  onBloodWorkStatus: (status: string) => void
  submitting?: boolean
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

export function Step11BloodWork({
  onNext,
  onBack,
  onBloodWorkFile,
  onBloodWorkStatus,
  submitting = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [bloodStatus, setBloodStatus] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <SectionCard
      section={11}
      title="Blood Work"
      subtitle="Strongly recommended but not mandatory. Get tested at any lab of your choice."
    >
      {/* Recommended tests */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
        <p className="text-xs font-medium text-[#0f172a] mb-3">
          Recommended tests
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {RECOMMENDED_TESTS.map((test) => (
            <p
              key={test}
              className="text-xs text-[#64748b] flex items-center gap-1.5"
            >
              <span className="w-1 h-1 rounded-full bg-[#00d4d4] flex-shrink-0" />
              {test}
            </p>
          ))}
        </div>
        <p className="text-xs text-[#94a3b8] mt-3">
          Get tested at Thyrocare, 1mg, SRL, or your local diagnostic centre.
        </p>
      </div>

      {/* Status */}
      <RadioGroup
        label="Have you had blood work done recently?"
        options={BLOOD_WORK_STATUS}
        value={bloodStatus}
        onChange={(v) => {
          setBloodStatus(v)
          onBloodWorkStatus(v)
        }}
      />

      {/* Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#64748b]">
          Upload blood report
          <span className="text-[#94a3b8] ml-1 font-normal">(optional)</span>
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          className={`
            border border-dashed rounded-lg p-5 text-center cursor-pointer
            transition-colors duration-150
            ${selectedFile
              ? 'border-[#00d4d4] bg-[#00d4d4]/5'
              : 'border-[#e2e8f0] hover:border-[#00d4d4]'
            }
          `}
        >
          {selectedFile ? (
            <div>
              <div className="text-xl mb-1">✅</div>
              <p className="text-xs text-[#00d4d4] font-medium">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {(selectedFile.size / 1024).toFixed(0)} KB · tap to change
              </p>
            </div>
          ) : (
            <div>
              <div className="text-xl text-[#00d4d4] mb-1">+</div>
              <p className="text-xs text-[#94a3b8]">PDF or image</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setSelectedFile(file)
              onBloodWorkFile(file)
            }}
          />
        </div>
        <p className="text-xs text-[#94a3b8]">
          You can also WhatsApp your report to Coach Mohit at any time.
        </p>
      </div>

      <NavButtons
  onBack={onBack}
  onNext={onNext}
  nextLabel={submitting ? 'Submitting...' : 'Submit Profile →'}
  loading={submitting}
/>
    </SectionCard>
  )
}

