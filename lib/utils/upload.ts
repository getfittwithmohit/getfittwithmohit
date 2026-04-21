import { supabase } from '@/lib/supabase/client'

// Upload a file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// Upload progress photo
export async function uploadProgressPhoto(
  clientId: string,
  weekNumber: number,
  type: 'front' | 'side' | 'back',
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${clientId}/week-${weekNumber}/${type}.${ext}`
  return uploadFile('progress-photos', path, file)
}

// Upload blood work report
export async function uploadBloodWork(
  clientId: string,
  file: File
): Promise<string | null> {
  console.log('uploadBloodWork called', { clientId, fileName: file.name })
  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const path = `${clientId}/${timestamp}.${ext}`
  return uploadFile('blood-work', path, file)
}