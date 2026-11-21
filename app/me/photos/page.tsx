'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { Icon } from '@/components/ui/Icon'
import { Card, LargeTitle, Screen, SectionTitle, T } from '@/components/ui/ios'
import { StoredPhoto } from '@/components/ui/StoredPhoto'
import { toast } from '@/lib/ui/feedback'
import { formatDayLabel, istDate } from '@/lib/utils/istDate'
import {
  POSES,
  getPhotoSets,
  mergeWeek,
  photosDue,
  savePhotoSet,
  signPaths,
  type PhotoSet,
  type Pose,
} from '@/lib/photos/progressPhotos'

const POSE_LABEL: Record<Pose, string> = { front: 'Front', side: 'Side', back: 'Back' }

// Client: add progress photos every 4 weeks and compare Week 1 with now.
export default function ProgressPhotosPage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()
  const [sets, setSets] = useState<PhotoSet[] | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    if (!client) return
    try {
      const s = await getPhotoSets(client.id)
      setSets(s)
      setUrls(await signPaths(s.flatMap((x) => POSES.map((p) => x.paths[p]))))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your photos')
    }
  }, [client])

  useEffect(() => {
    if (checking || loading || !client) return
    let cancelled = false
    getPhotoSets(client.id)
      .then(async (s) => {
        const u = await signPaths(s.flatMap((x) => POSES.map((p) => x.paths[p])))
        if (!cancelled) { setSets(s); setUrls(u) }
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your photos') })
    return () => { cancelled = true }
  }, [checking, loading, client])

  const weeks = useMemo(() => (sets ? [...new Set(sets.map((s) => s.week))].sort((a, b) => a - b) : []), [sets])

  if (checking || loading) return <PageLoader />
  if (!client) return null

  const due = sets ? photosDue(sets, client.current_week, client.phase) : false
  const firstWeek = weeks[0]
  const lastWeek = weeks[weeks.length - 1]
  const first = firstWeek !== undefined && sets ? mergeWeek(sets, firstWeek) : null
  const latest = lastWeek !== undefined && sets ? mergeWeek(sets, lastWeek) : null
  const thisWeekDone = lastWeek === client.current_week

  return (
    <Screen>
      <Link href="/me" className="self-start -ml-1 min-h-11 flex items-center gap-1 text-[17px]" style={{ color: T.teal }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Me
      </Link>
      <LargeTitle eyebrow={client.phase === 'Onboarding' ? undefined : `Week ${client.current_week}`} title="Progress photos" />

      {error && <div className="bg-red-50 border border-red-200 text-[#b91c1c] text-sm rounded-2xl p-4">{error}</div>}

      {!sets ? (
        <div className="h-72 rounded-2xl bg-white/70 animate-pulse" />
      ) : adding ? (
        <AddPhotos
          week={client.current_week}
          reference={first}
          urls={urls}
          onCancel={() => setAdding(false)}
          onSave={async (files) => {
            await savePhotoSet(client.id, client.current_week, files)
            toast('Photos saved. Only you and Coach Mohit can see them.', 'success')
            setAdding(false)
            await load()
          }}
        />
      ) : (
        <>
          {weeks.length >= 2 && first && latest ? (
            <Compare first={first} latest={latest} firstWeek={firstWeek} lastWeek={lastWeek} urls={urls} />
          ) : weeks.length === 1 ? (
            <Card className="flex flex-col gap-1">
              <span className="text-base font-semibold">Your “before” is saved</span>
              <span className="text-[15px]" style={{ color: T.sec }}>
                Every 4 weeks you’ll add a new set. Then you can slide between Week {firstWeek} and now.
              </span>
            </Card>
          ) : (
            <Card className="flex flex-col gap-1">
              <span className="text-base font-semibold">No photos yet</span>
              <span className="text-[15px]" style={{ color: T.sec }}>Take your first set today. It becomes your “before”.</span>
            </Card>
          )}

          {(due || weeks.length === 0) && !thisWeekDone && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="min-h-[54px] rounded-2xl flex items-center justify-center gap-2 text-[17px] font-bold"
              style={{ background: T.cyan, color: '#0a0f1a' }}
            >
              <Icon name="camera" size={20} />Add Week {client.current_week} photos
            </button>
          )}
          {!due && weeks.length > 0 && !thisWeekDone && (
            <p className="text-sm text-center px-4" style={{ color: T.ter }}>
              Next photos are due in week {lastWeek + 4}.{' '}
              <button type="button" onClick={() => setAdding(true)} className="font-semibold underline" style={{ color: T.teal }}>Add photos now</button>
            </p>
          )}

          {weeks.length > 0 && (
            <>
              <SectionTitle>All photos</SectionTitle>
              {[...weeks].reverse().map((w) => {
                const merged = mergeWeek(sets, w)
                const date = sets.filter((s) => s.week === w).slice(-1)[0]?.uploadedAt
                return (
                  <Card key={w} className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-semibold">{w === firstWeek ? `Week ${w} · Before` : `Week ${w}`}</span>
                      {date && <span className="text-sm" style={{ color: T.ter }}>{formatDayLabel(istDate(new Date(date)))}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {POSES.map((p) => (
                        <div key={p} className="flex flex-col gap-1">
                          <Thumb url={merged[p] ? urls[merged[p]!] : undefined} path={merged[p]} alt={`${POSE_LABEL[p]}, week ${w}`} />
                          <span className="text-sm text-center" style={{ color: T.sec }}>{POSE_LABEL[p]}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </>
          )}

          <p className="text-sm text-center px-6" style={{ color: T.ter }}>
            Private: only you and Coach Mohit can see your photos.
          </p>
        </>
      )}
    </Screen>
  )
}

function Thumb({ url, alt, path }: { url?: string; alt: string; path?: string | null }) {
  return url ? (
    <StoredPhoto url={url} path={path} alt={alt} className="w-full aspect-[3/4] object-cover rounded-xl bg-[#E5E7EB]" />
  ) : (
    <div className="w-full aspect-[3/4] rounded-xl bg-[#EEF2F6] flex items-center justify-center text-sm" style={{ color: T.ter }}>—</div>
  )
}

function Compare({
  first,
  latest,
  firstWeek,
  lastWeek,
  urls,
}: {
  first: Record<Pose, string | null>
  latest: Record<Pose, string | null>
  firstWeek: number
  lastWeek: number
  urls: Record<string, string>
}) {
  const available = POSES.filter((p) => first[p] && latest[p])
  const [pose, setPose] = useState<Pose>(available[0] || 'front')
  const [pos, setPos] = useState(50)
  const before = first[pose] ? urls[first[pose]!] : undefined
  const after = latest[pose] ? urls[latest[pose]!] : undefined

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">Before → Now</span>
        <span className="text-sm" style={{ color: T.ter }}>{lastWeek - firstWeek} weeks apart</span>
      </div>
      <div role="tablist" aria-label="Pose" className="grid grid-cols-3 gap-1 bg-[#E3E7ED] rounded-xl p-[3px]">
        {POSES.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pose === p}
            disabled={!first[p] || !latest[p]}
            onClick={() => setPose(p)}
            className="min-h-10 rounded-[10px] text-[15px] font-semibold disabled:opacity-40"
            style={pose === p ? { background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.14)' } : undefined}
          >
            {POSE_LABEL[p]}
          </button>
        ))}
      </div>
      {before && after ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#E5E7EB] select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt={`Week ${lastWeek}`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt={`Week ${firstWeek}`} className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
          <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} aria-hidden="true">
            <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-[#0f172a] text-sm font-bold">↔</span>
          </div>
          <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-black/55 text-white">Week {firstWeek}</span>
          <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-black/55 text-white">Week {lastWeek}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Slide between before and now"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
        </div>
      ) : (
        <p className="text-sm" style={{ color: T.ter }}>This pose is missing in one of the weeks.</p>
      )}
      <p className="text-sm text-center" style={{ color: T.ter }}>Drag across the photo to compare</p>
    </Card>
  )
}

function AddPhotos({
  week,
  reference,
  urls,
  onCancel,
  onSave,
}: {
  week: number
  reference: Record<Pose, string | null> | null
  urls: Record<string, string>
  onCancel: () => void
  onSave: (files: Partial<Record<Pose, File>>) => Promise<void>
}) {
  const [files, setFiles] = useState<Partial<Record<Pose, File>>>({})
  const [previews, setPreviews] = useState<Partial<Record<Pose, string>>>({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pick = (pose: Pose, file: File | undefined) => {
    if (!file) return
    setFiles((f) => ({ ...f, [pose]: file }))
    setPreviews((p) => ({ ...p, [pose]: URL.createObjectURL(file) }))
  }

  const count = Object.keys(files).length

  return (
    <>
      <Card className="flex flex-col gap-2">
        <span className="text-base font-semibold">For a fair comparison</span>
        <ul className="m-0 pl-5 text-[15px] leading-relaxed" style={{ color: T.sec }}>
          <li>Same spot and light as last time</li>
          <li>Morning, before food or water</li>
          <li>Same clothing, phone at chest height</li>
          <li>Relaxed, natural posture</li>
        </ul>
      </Card>

      {POSES.map((pose) => {
        const ref = reference?.[pose] ? urls[reference[pose]!] : undefined
        return (
          <Card key={pose} className="flex flex-col gap-3">
            <span className="text-base font-semibold">{POSE_LABEL[pose]}</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Thumb url={ref} alt={`Your week 1 ${pose} photo`} />
                <span className="text-sm text-center" style={{ color: T.ter }}>{ref ? 'Week 1 — match this' : 'No earlier photo'}</span>
              </div>
              <label className="flex flex-col gap-1 cursor-pointer">
                {previews[pose] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[pose]} alt={`New ${pose} photo`} className="w-full aspect-[3/4] object-cover rounded-xl" />
                ) : (
                  <span className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[#CBD5E1] flex flex-col items-center justify-center gap-2" style={{ color: T.teal }}>
                    <Icon name="camera" size={28} />
                    <span className="text-[15px] font-semibold">Take photo</span>
                  </span>
                )}
                <span className="text-sm text-center" style={{ color: T.ter }}>{previews[pose] ? 'Tap to retake' : `Week ${week}`}</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(pose, e.target.files?.[0])} />
              </label>
            </div>
          </Card>
        )
      })}

      {err && <div className="bg-red-50 border border-red-200 text-[#b91c1c] text-sm rounded-2xl p-4">{err}</div>}

      <button
        type="button"
        disabled={!count || saving}
        onClick={async () => {
          setSaving(true)
          setErr(null)
          try {
            await onSave(files)
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Could not save your photos')
          } finally {
            setSaving(false)
          }
        }}
        className="min-h-[54px] rounded-2xl text-[17px] font-bold disabled:opacity-50"
        style={{ background: T.cyan, color: '#0a0f1a' }}
      >
        {saving ? 'Saving…' : count === 3 ? 'Save my photos' : count ? `Save ${count} of 3 photos` : 'Take at least one photo'}
      </button>
      <button type="button" onClick={onCancel} className="min-h-11 text-base" style={{ color: T.ter }}>Cancel</button>
    </>
  )
}
