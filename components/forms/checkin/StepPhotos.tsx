'use client'

import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Icon } from '@/components/ui/Icon'
import { StoredPhoto } from '@/components/ui/StoredPhoto'
import { savePhotoSet, type Pose } from '@/lib/photos/progressPhotos'

// Shown before the weekly check-in when progress photos are due. Front and
// side are required; the check-in continues once they're saved.

const POSES: { pose: Pose; label: string; hint: string; required: boolean }[] = [
  { pose: 'front', label: 'Front', hint: 'Facing the camera, arms at your sides', required: true },
  { pose: 'side', label: 'Side', hint: 'Facing left, arms at your sides', required: true },
  { pose: 'back', label: 'Back', hint: 'Facing away', required: false },
]

function Pick({
  label,
  hint,
  required,
  file,
  reference,
  error,
  onPick,
}: {
  label: string
  hint: string
  required: boolean
  file: File | null
  reference?: string
  error: boolean
  onPick: (f: File | null) => void
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  return (
    <div className="flex gap-3 items-center">
      {reference && (
        <div className="w-20 flex-shrink-0 flex flex-col gap-1">
          <StoredPhoto url={reference} alt={`Your earlier ${label.toLowerCase()} photo`} className="w-full aspect-[3/4] object-cover rounded-xl opacity-90" />
          <span className="text-xs text-center text-[#64748b]">Match this</span>
        </div>
      )}
      <label className="flex-1 flex gap-3 items-center cursor-pointer">
        <span className={`w-20 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-dashed ${file ? 'border-transparent' : error ? 'border-[#ef4444]' : 'border-[#CBD5E1]'}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`New ${label.toLowerCase()} photo`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#007A8A]"><Icon name="camera" size={24} /></span>
          )}
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-base font-semibold text-[#0f172a]">
            {label}{required ? <span className="text-[#007A8A] ml-0.5">*</span> : <span className="text-sm font-normal text-[#64748b] ml-1">(optional)</span>}
          </span>
          <span className="text-sm text-[#64748b]">{hint}</span>
          <span className="text-sm font-semibold text-[#007A8A]">{file ? 'Tap to retake' : 'Tap to take photo'}</span>
        </span>
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

export function StepPhotos({
  clientId,
  week,
  references,
  onDone,
}: {
  clientId: string
  week: number
  references: Partial<Record<Pose, string>>
  onDone: () => void
}) {
  const [files, setFiles] = useState<Partial<Record<Pose, File | null>>>({})
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missing = !files.front || !files.side

  const save = async () => {
    if (missing) return setTried(true)
    setSaving(true)
    setError(null)
    try {
      const chosen: Partial<Record<Pose, File>> = {}
      for (const p of POSES) if (files[p.pose]) chosen[p.pose] = files[p.pose]!
      await savePhotoSet(clientId, week, chosen)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your photos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      section={0}
      title="Progress photos first"
      subtitle="It’s photo week. Two minutes now — the photos you’ll thank yourself for in 12 weeks."
    >
      <div className="bg-[#E6F7F9] rounded-2xl px-4 py-3 text-[15px] text-[#0f172a] leading-relaxed">
        <strong>Private</strong> — only you and Coach Mohit see these. Same spot, same light and same clothing as last time.
      </div>

      {POSES.map((p) => (
        <Pick
          key={p.pose}
          label={p.label}
          hint={p.hint}
          required={p.required}
          file={files[p.pose] || null}
          reference={references[p.pose]}
          error={tried && p.required && !files[p.pose]}
          onPick={(f) => setFiles((prev) => ({ ...prev, [p.pose]: f }))}
        />
      ))}

      {tried && missing && (
        <p className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-xl px-4 py-3">Please add your front and side photos to continue.</p>
      )}
      {error && <p className="text-[15px] text-[#B91C1C] bg-[#FEF2F2] rounded-xl px-4 py-3">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full min-h-[54px] rounded-2xl bg-[#00D4E8] text-[#1a1f3a] text-[17px] font-bold disabled:opacity-50"
      >
        {saving ? 'Saving photos…' : 'Save photos & continue'}
      </button>
    </SectionCard>
  )
}
