'use client'

import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { NavButtons } from '@/components/ui/NavButtons'
import { Icon } from '@/components/ui/Icon'

interface Props {
  onNext: () => void
  onBack: () => void
  onPhotosSelect: (photos: {
    front: File | null
    side: File | null
    back: File | null
  }) => void
}

function PhotoUpload({
  label,
  hint,
  required,
  onFileSelect,
  selectedFile,
  error,
}: {
  label: string
  hint: string
  required?: boolean
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  error?: boolean
}) {
  const preview = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  return (
    <label className="flex gap-4 items-center cursor-pointer">
      <span
        className={`w-24 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-dashed ${
          selectedFile ? 'border-transparent' : error ? 'border-[#ef4444]' : 'border-[#CBD5E1]'
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${label} preview`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#007A8A]"><Icon name="camera" size={26} /></span>
        )}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-base font-semibold text-[#0f172a]">
          {label}
          {required ? <span className="text-[#00D4E8] ml-0.5">*</span> : <span className="text-[#64748b] ml-1 text-sm font-normal">(optional)</span>}
        </span>
        <span className="text-sm text-[#64748b]">{hint}</span>
        <span className="text-sm font-semibold text-[#007A8A]">{selectedFile ? 'Tap to retake' : 'Tap to add'}</span>
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
      />
    </label>
  )
}

// Front and side are required: they are the "before" every later
// comparison and transformation card is built on. Back stays optional.
export function Step10Photos({ onNext, onBack, onPhotosSelect }: Props) {
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [sidePhoto, setSidePhoto] = useState<File | null>(null)
  const [backPhoto, setBackPhoto] = useState<File | null>(null)
  const [tried, setTried] = useState(false)

  const missing = !frontPhoto || !sidePhoto

  const handleNext = () => {
    if (missing) {
      setTried(true)
      return
    }
    onPhotosSelect({ front: frontPhoto, side: sidePhoto, back: backPhoto })
    onNext()
  }

  return (
    <SectionCard
      section={10}
      title="Progress Photos"
      subtitle="Your “before”. In 12 weeks these become the most motivating photos you’ll ever see."
    >
      <div className="bg-[#E6F7F9] rounded-xl px-4 py-3 text-[15px] text-[#0f172a] leading-relaxed flex gap-3 items-start">
        <span className="text-[#007A8A] mt-0.5"><Icon name="target" size={18} /></span>
        <span>
          <strong>Private.</strong> Only you and Coach Mohit can see these. Fitted clothes or gym wear are perfect.
          Good light, phone at chest height.
        </span>
      </div>

      <PhotoUpload label="Front photo" required hint="Stand straight, arms at your sides, facing the camera" selectedFile={frontPhoto} onFileSelect={setFrontPhoto} error={tried && !frontPhoto} />
      <PhotoUpload label="Side photo" required hint="Stand straight, arms at your sides, facing left" selectedFile={sidePhoto} onFileSelect={setSidePhoto} error={tried && !sidePhoto} />
      <PhotoUpload label="Back photo" hint="Stand straight, arms at your sides, facing away" selectedFile={backPhoto} onFileSelect={setBackPhoto} />

      {tried && missing && (
        <p className="text-sm text-[#ef4444] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Please add your front and side photos — they’re your starting point.
        </p>
      )}

      <NavButtons onBack={onBack} onNext={handleNext} />
    </SectionCard>
  )
}
