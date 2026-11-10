import { supabase } from '@/lib/supabase/client'
import { MAX_UPLOAD_MB, SIGNED_URL_SECONDS, STORAGE_BUCKETS } from '@/lib/constants/content'
import type {
  Audio,
  AudioProgress,
  Course,
  CourseLesson,
  CourseWithLessons,
  LessonDocument,
} from '@/lib/types/content'

// Courses + Audio Library queries.
//
// Everything here runs from the browser with the logged-in user's session, so
// Row Level Security (supabase/courses_and_audios.sql) decides what each
// caller can see: the coach gets everything, an active client gets published
// content plus their own progress rows.
//
// Every function throws on failure instead of returning null — callers show
// the message to the user rather than failing silently.

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message || 'unknown error'}`)
}

function bySortOrder<T extends { sort_order: number; created_at: string }>(a: T, b: T) {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
}

// ── Files ────────────────────────────────────────────────────────────────────

function safeFileName(name: string): string {
  const cleaned = name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
  return cleaned.slice(-80) || 'file'
}

async function uploadPrivateFile(bucket: string, folder: string, file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(
      `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is ${MAX_UPLOAD_MB} MB per file. Split or compress it and try again.`
    )
  }
  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined })
  if (error || !data) fail('Upload failed', error)
  return data.path
}

async function removeFiles(bucket: string, paths: string[]) {
  if (!paths.length) return
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) fail('Could not delete file', error)
}

async function signedUrl(bucket: string, path: string, seconds: number): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds)
  if (error || !data?.signedUrl) fail('Could not open file', error)
  return data.signedUrl
}

export function getDocumentUrl(doc: Pick<LessonDocument, 'file_path'>) {
  return signedUrl(STORAGE_BUCKETS.courseDocs, doc.file_path, SIGNED_URL_SECONDS.document)
}

export function getAudioUrl(audio: Pick<Audio, 'file_path'>) {
  return signedUrl(STORAGE_BUCKETS.audioLibrary, audio.file_path, SIGNED_URL_SECONDS.audio)
}

// ── Courses (read) ───────────────────────────────────────────────────────────

const COURSE_WITH_LESSONS = '*, course_lessons(*, lesson_documents(*))'

function sortCourse(course: CourseWithLessons): CourseWithLessons {
  const lessons = [...(course.course_lessons || [])].sort(bySortOrder).map((l) => ({
    ...l,
    lesson_documents: [...(l.lesson_documents || [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }))
  return { ...course, course_lessons: lessons }
}

// Coach sees drafts too; clients only ever receive published courses (RLS).
export async function getCourses(): Promise<CourseWithLessons[]> {
  const { data, error } = await supabase.from('courses').select(COURSE_WITH_LESSONS)
  if (error) fail('Could not load courses', error)
  return ((data || []) as CourseWithLessons[]).sort(bySortOrder).map(sortCourse)
}

export async function getCourse(id: string): Promise<CourseWithLessons | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_WITH_LESSONS)
    .eq('id', id)
    .maybeSingle()
  if (error) fail('Could not load course', error)
  return data ? sortCourse(data as CourseWithLessons) : null
}

// ── Courses (coach) ──────────────────────────────────────────────────────────

export async function createCourse(input: { title: string; description: string; sort_order: number }) {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: input.title.trim(),
      description: input.description.trim() || null,
      sort_order: input.sort_order,
    })
    .select()
    .single()
  if (error || !data) fail('Could not create course', error)
  return data as Course
}

export async function updateCourse(
  id: string,
  changes: Partial<Pick<Course, 'title' | 'description' | 'is_published' | 'sort_order'>>
) {
  const { error } = await supabase
    .from('courses')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) fail('Could not save course', error)
}

export async function deleteCourse(course: CourseWithLessons) {
  const paths = course.course_lessons.flatMap((l) =>
    (l.lesson_documents || []).map((d) => d.file_path)
  )
  // Rows first (lessons, documents and progress cascade), then the files.
  const { error } = await supabase.from('courses').delete().eq('id', course.id)
  if (error) fail('Could not delete course', error)
  await removeFiles(STORAGE_BUCKETS.courseDocs, paths)
}

export async function saveLesson(input: {
  id?: string
  course_id: string
  title: string
  description: string
  video_url: string
  duration_minutes: number | null
  sort_order: number
}) {
  const row = {
    course_id: input.course_id,
    title: input.title.trim(),
    description: input.description.trim() || null,
    video_url: input.video_url.trim() || null,
    duration_minutes: input.duration_minutes,
    sort_order: input.sort_order,
  }
  const query = input.id
    ? supabase.from('course_lessons').update(row).eq('id', input.id).select().single()
    : supabase.from('course_lessons').insert(row).select().single()
  const { data, error } = await query
  if (error || !data) fail('Could not save lesson', error)
  return data as CourseLesson
}

export async function deleteLesson(lesson: CourseLesson) {
  const paths = (lesson.lesson_documents || []).map((d) => d.file_path)
  const { error } = await supabase.from('course_lessons').delete().eq('id', lesson.id)
  if (error) fail('Could not delete lesson', error)
  await removeFiles(STORAGE_BUCKETS.courseDocs, paths)
}

// Swap-free reorder: rewrite sort_order for the whole list in its new order.
export async function reorderLessons(orderedLessonIds: string[]) {
  const results = await Promise.all(
    orderedLessonIds.map((id, index) =>
      supabase.from('course_lessons').update({ sort_order: index }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) fail('Could not reorder lessons', failed.error)
}

export async function addLessonDocument(lesson: CourseLesson, title: string, file: File) {
  const path = await uploadPrivateFile(
    STORAGE_BUCKETS.courseDocs,
    `${lesson.course_id}/${lesson.id}`,
    file
  )
  const { data, error } = await supabase
    .from('lesson_documents')
    .insert({ lesson_id: lesson.id, title: title.trim() || file.name, file_path: path })
    .select()
    .single()
  if (error || !data) {
    // Don't leave an orphaned file behind if the row couldn't be saved
    await supabase.storage.from(STORAGE_BUCKETS.courseDocs).remove([path])
    fail('Could not save document', error)
  }
  return data as LessonDocument
}

export async function deleteLessonDocument(doc: LessonDocument) {
  const { error } = await supabase.from('lesson_documents').delete().eq('id', doc.id)
  if (error) fail('Could not delete document', error)
  await removeFiles(STORAGE_BUCKETS.courseDocs, [doc.file_path])
}

// ── Lesson progress (client) ─────────────────────────────────────────────────

export async function getCompletedLessonIds(clientId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('client_id', clientId)
  if (error) fail('Could not load your progress', error)
  return new Set((data || []).map((r) => r.lesson_id as string))
}

export async function setLessonCompleted(clientId: string, lessonId: string, completed: boolean) {
  if (completed) {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert(
        { client_id: clientId, lesson_id: lessonId, completed_at: new Date().toISOString() },
        { onConflict: 'client_id,lesson_id' }
      )
    if (error) fail('Could not save your progress', error)
  } else {
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('client_id', clientId)
      .eq('lesson_id', lessonId)
    if (error) fail('Could not save your progress', error)
  }
}

// ── Audios ───────────────────────────────────────────────────────────────────

// Coach sees drafts too; clients only ever receive published audios (RLS).
export async function getAudios(): Promise<Audio[]> {
  const { data, error } = await supabase.from('audios').select('*')
  if (error) fail('Could not load audios', error)
  return ((data || []) as Audio[]).sort(bySortOrder)
}

export async function createAudio(input: {
  title: string
  description: string
  category: Audio['category']
  collection: string
  sort_order: number
  duration_seconds: number | null
  file: File
}) {
  const path = await uploadPrivateFile(STORAGE_BUCKETS.audioLibrary, 'library', input.file)
  const { data, error } = await supabase
    .from('audios')
    .insert({
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category,
      collection: input.collection.trim() || null,
      sort_order: input.sort_order,
      duration_seconds: input.duration_seconds,
      file_path: path,
    })
    .select()
    .single()
  if (error || !data) {
    await supabase.storage.from(STORAGE_BUCKETS.audioLibrary).remove([path])
    fail('Could not save audio', error)
  }
  return data as Audio
}

export async function updateAudio(
  id: string,
  changes: Partial<
    Pick<Audio, 'title' | 'description' | 'category' | 'collection' | 'sort_order' | 'is_published'>
  >
) {
  const { error } = await supabase.from('audios').update(changes).eq('id', id)
  if (error) fail('Could not save audio', error)
}

export async function deleteAudio(audio: Audio) {
  const { error } = await supabase.from('audios').delete().eq('id', audio.id)
  if (error) fail('Could not delete audio', error)
  await removeFiles(STORAGE_BUCKETS.audioLibrary, [audio.file_path])
}

// ── Audio progress (client) ──────────────────────────────────────────────────

export async function getAudioProgress(clientId: string): Promise<Record<string, AudioProgress>> {
  const { data, error } = await supabase
    .from('audio_progress')
    .select('audio_id, position_seconds, completed')
    .eq('client_id', clientId)
  if (error) fail('Could not load your listening progress', error)
  const map: Record<string, AudioProgress> = {}
  for (const row of (data || []) as AudioProgress[]) map[row.audio_id] = row
  return map
}

export async function saveAudioProgress(
  clientId: string,
  audioId: string,
  positionSeconds: number,
  completed: boolean
) {
  const { error } = await supabase.from('audio_progress').upsert(
    {
      client_id: clientId,
      audio_id: audioId,
      position_seconds: Math.max(0, Math.floor(positionSeconds)),
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,audio_id' }
  )
  if (error) fail('Could not save your listening progress', error)
}
