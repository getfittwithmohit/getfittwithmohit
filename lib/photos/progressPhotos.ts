import { supabase } from '@/lib/supabase/client'
import { heicToJpeg, isHeicFile, looksHeic } from '@/lib/photos/heic'

// Client progress photos: onboarding is Week 1, then a new set every 4 weeks.
// Files live in the private 'progress-photos' bucket under <clientId>/week-N/
// and are shown through short-lived signed links.

export const PHOTO_EVERY_WEEKS = 4
export const POSES = ['front', 'side', 'back'] as const
export type Pose = (typeof POSES)[number]

export interface PhotoSet {
  id: string
  week: number
  uploadedAt: string
  paths: Record<Pose, string | null>
}

export async function getPhotoSets(clientId: string): Promise<PhotoSet[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('id, week_number, uploaded_at, front_photo_url, side_photo_url, back_photo_url')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true })
    .order('uploaded_at', { ascending: true })
  if (error) throw new Error(`Could not load your photos: ${error.message}`)
  return (data || []).map((r) => ({
    id: r.id,
    week: r.week_number ?? 1,
    uploadedAt: r.uploaded_at,
    paths: { front: r.front_photo_url, side: r.side_photo_url, back: r.back_photo_url },
  }))
}

// Latest photo of each pose for a given week (a week can have several uploads)
export function mergeWeek(sets: PhotoSet[], week: number): Record<Pose, string | null> {
  const out: Record<Pose, string | null> = { front: null, side: null, back: null }
  for (const s of sets.filter((x) => x.week === week)) {
    for (const p of POSES) if (s.paths[p]) out[p] = s.paths[p]
  }
  return out
}

export async function signPaths(paths: (string | null)[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean) as string[])]
  const out: Record<string, string> = {}
  await Promise.all(
    unique.map(async (p) => {
      const { data } = await supabase.storage.from('progress-photos').createSignedUrl(p, 60 * 30)
      if (data?.signedUrl) out[p] = data.signedUrl
    })
  )
  return out
}

// Are new photos due? Not during onboarding; due once the latest set is
// PHOTO_EVERY_WEEKS or more weeks old (or there is none yet).
export function photosDue(sets: { week: number }[], currentWeek: number, phase: string): boolean {
  if (phase === 'Onboarding' || currentWeek < 2) return false
  const latest = sets.reduce((m, s) => Math.max(m, s.week), 0)
  return latest === 0 || currentWeek - latest >= PHOTO_EVERY_WEEKS
}

// Phone photos are 3–8 MB; shrink to ≤1600px JPEG before upload.
export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  let source: Blob = file
  try {
    // Chrome/Android can't decode iPhone HEIC photos: convert them first
    if (isHeicFile(file) || (await looksHeic(file))) {
      try { await createImageBitmap(file) } catch { source = await heicToJpeg(file, quality) }
    }
  } catch {
    // conversion failed — fall through and try the original
  }
  try {
    const bitmap = await createImageBitmap(source)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob || source
  } catch {
    return source // couldn't re-encode: upload what we have
  }
}

// Uploads the chosen poses, then saves one record for the week. Throws with a
// clear message on any failure so nothing is half-saved silently.
export async function savePhotoSet(clientId: string, week: number, files: Partial<Record<Pose, File>>) {
  const stamp = Date.now()
  const paths: Record<Pose, string | null> = { front: null, side: null, back: null }
  for (const pose of POSES) {
    const file = files[pose]
    if (!file) continue
    const blob = await compressImage(file)
    const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg')
    const path = `${clientId}/week-${week}/${pose}-${stamp}.${ext}`
    const { error } = await supabase.storage.from('progress-photos').upload(path, blob, {
      contentType: blob.type || file.type || 'image/jpeg',
      upsert: false,
    })
    if (error) throw new Error(`Your ${pose} photo didn’t upload: ${error.message}`)
    paths[pose] = path
  }
  const { error } = await supabase.from('progress_photos').insert({
    client_id: clientId,
    week_number: week,
    front_photo_url: paths.front,
    side_photo_url: paths.side,
    back_photo_url: paths.back,
  })
  if (error) throw new Error(`Photos uploaded but not saved: ${error.message}`)
}
