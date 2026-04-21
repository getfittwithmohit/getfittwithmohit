'use client'

import { useRef, useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'

interface Props {
  onNext: () => void
  onBack: () => void
  onPhotosSelect: (photos: {
    front: File | null
    side: File | null
    back: File | null
  }) => void
}

interface PhotoUploadProps {
  label: string
  hint: string
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

function PhotoUpload({
  label,
  hint,
  onFileSelect,
  selectedFile,
}: PhotoUploadProps) {
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
            <p className="text-xs text-[#94a3b8]">Tap to upload</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  )
}

export function Step10Photos({ onNext, onBack, onPhotosSelect }: Props) {
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [sidePhoto, setSidePhoto] = useState<File | null>(null)
  const [backPhoto, setBackPhoto] = useState<File | null>(null)

  const handleNext = () => {
    onPhotosSelect({
      front: frontPhoto,
      side: sidePhoto,
      back: backPhoto,
    })
    onNext()
  }

  return (
    <SectionCard
      section={10}
      title="Progress Photos"
      subtitle="Optional but powerful. Your Week 0 photos become the most motivating thing you'll see at Week 12."
    >
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm text-[#64748b] leading-relaxed">
        Photos are{' '}
        <strong className="text-[#0f172a]">private</strong> — only
        visible to you and Coach Mohit. You can also WhatsApp them
        directly at any time.
      </div>

      <PhotoUpload
        label="Front photo"
        hint="Stand straight, arms at sides, facing the camera"
        selectedFile={frontPhoto}
        onFileSelect={setFrontPhoto}
      />
      <PhotoUpload
        label="Side photo"
        hint="Stand straight, arms at sides, facing left"
        selectedFile={sidePhoto}
        onFileSelect={setSidePhoto}
      />
      <PhotoUpload
        label="Back photo"
        hint="Stand straight, arms at sides, facing away"
        selectedFile={backPhoto}
        onFileSelect={setBackPhoto}
      />

      <NavButtons onBack={onBack} onNext={handleNext} />
    </SectionCard>
  )
}