'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDayLabel, istDate } from '@/lib/utils/istDate'

// Coach view of a client's progress photos (onboarding = week 1) and
// blood-work reports. Both buckets are private: files open through signed
// links that expire after 10 minutes.

const LINK_SECONDS = 60 * 10
const POSES = ['front', 'side', 'back'] as const
type Pose = (typeof POSES)[number]

interface PhotoSet {
  id: string
  week: number | null
  uploadedAt: string
  urls: Record<Pose, { url: string | null; missing: boolean } | null>
}

interface Report {
  id: string
  uploadedAt: string
  reviewed: boolean
  url: string | null
  missing: boolean
}

// Older blood-work rows stored a public URL; the bucket is private now, so
// pull the file path back out of it.
function bloodWorkPath(stored: string | null): string | null {
  if (!stored) return null
  const marker = '/blood-work/'
  const i = stored.indexOf(marker)
  return i >= 0 ? decodeURIComponent(stored.slice(i + marker.length).split('?')[0]) : stored
}

async function signed(bucket: string, path: string | null) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, LINK_SECONDS)
  return { url: data?.signedUrl ?? null, missing: !!error || !data?.signedUrl }
}

export function ClientPhotos({ clientId }: { clientId: string }) {
  const [photos, setPhotos] = useState<PhotoSet[] | null>(null)
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [photoRes, bloodRes] = await Promise.all([
        supabase.from('progress_photos').select('*').eq('client_id', clientId).order('week_number', { ascending: true }),
        supabase.from('blood_work').select('*').eq('client_id', clientId).order('uploaded_at', { ascending: false }),
      ])
      if (photoRes.error || bloodRes.error) {
        if (!cancelled) setError((photoRes.error || bloodRes.error)!.message)
        return
      }
      const sets = await Promise.all(
        (photoRes.data || []).map(async (row) => ({
          id: row.id as string,
          week: row.week_number as number | null,
          uploadedAt: row.uploaded_at as string,
          urls: {
            front: await signed('progress-photos', row.front_photo_url),
            side: await signed('progress-photos', row.side_photo_url),
            back: await signed('progress-photos', row.back_photo_url),
          },
        }))
      )
      const reps = await Promise.all(
        (bloodRes.data || []).map(async (row) => {
          const s = await signed('blood-work', bloodWorkPath(row.report_url))
          return { id: row.id as string, uploadedAt: row.uploaded_at as string, reviewed: !!row.reviewed, url: s?.url ?? null, missing: !s || s.missing }
        })
      )
      if (!cancelled) { setPhotos(sets); setReports(reps) }
    }
    load().catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load photos') })
    return () => { cancelled = true }
  }, [clientId])

  const toggleReviewed = async (r: Report) => {
    const { error: e } = await supabase.from('blood_work').update({ reviewed: !r.reviewed }).eq('id', r.id)
    if (e) return setError(e.message)
    setReports((prev) => prev && prev.map((x) => (x.id === r.id ? { ...x, reviewed: !x.reviewed } : x)))
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-[#b91c1c] text-sm rounded-xl p-4">Couldn’t load photos: {error}</div>
  }
  if (!photos || !reports) {
    return <div className="h-40 rounded-2xl bg-white border border-[#e2e8f0] animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-3">Progress photos</p>
        {photos.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 text-sm text-[#64748b]">
            No photos yet. Photos added during onboarding (front, side, back) will show here as Week 1.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {photos.map((set) => (
              <div key={set.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-base font-semibold text-[#0f172a]">
                    {set.week === 1 ? 'Week 1 · Before' : `Week ${set.week ?? '?'}`}
                  </p>
                  <p className="text-sm text-[#64748b]">{formatDayLabel(istDate(new Date(set.uploadedAt)))}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {POSES.map((pose) => {
                    const p = set.urls[pose]
                    return (
                      <div key={pose} className="flex flex-col gap-1.5">
                        {p?.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="block aspect-[3/4] rounded-xl overflow-hidden bg-[#f1f5f9]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={`${pose} photo, week ${set.week ?? ''}`} className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <div className="aspect-[3/4] rounded-xl bg-[#f1f5f9] flex items-center justify-center text-center px-2 text-xs text-[#64748b]">
                            {p?.missing ? 'Upload failed — file not found' : 'Not added'}
                          </div>
                        )}
                        <span className="text-sm text-[#475569] text-center capitalize">{pose}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-3">Blood work</p>
        {reports.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 text-sm text-[#64748b]">No blood-work reports uploaded.</div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
            {reports.map((r, i) => (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-[#e2e8f0]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#0f172a]">Report · {formatDayLabel(istDate(new Date(r.uploadedAt)))}</p>
                  <p className={`text-sm ${r.reviewed ? 'text-[#15803D]' : 'text-[#B45309]'}`}>{r.reviewed ? 'Reviewed' : 'Not reviewed yet'}</p>
                </div>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#007A8A] px-3 min-h-10 flex items-center">Open</a>
                ) : (
                  <span className="text-sm text-[#b91c1c]">{r.missing ? 'File not found' : '—'}</span>
                )}
                <button
                  type="button"
                  onClick={() => toggleReviewed(r)}
                  className="text-sm text-[#475569] border border-[#e2e8f0] rounded-full px-3 min-h-10"
                >
                  {r.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-sm text-[#64748b]">Links are private and expire after 10 minutes. Reopen this tab to refresh them.</p>
    </div>
  )
}
