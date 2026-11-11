'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  addLessonDocument,
  createCourse,
  deleteCourse,
  deleteLesson,
  deleteLessonDocument,
  getCourses,
  getDocumentUrl,
  reorderLessons,
  saveLesson,
  updateCourse,
} from '@/lib/supabase/queries/content'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import type { CourseLesson, CourseWithLessons, LessonDocument } from '@/lib/types/content'
import { fieldClass, labelClass, PublishToggle } from './shared'

type LessonDraft = {
  id?: string
  title: string
  description: string
  video_url: string
  duration_minutes: string
}

const EMPTY_LESSON: LessonDraft = { title: '', description: '', video_url: '', duration_minutes: '' }

export function CourseManager() {
  const [courses, setCourses] = useState<CourseWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openCourseId, setOpenCourseId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const [editingCourse, setEditingCourse] = useState<{ id: string; title: string; description: string } | null>(null)
  const [lessonDraft, setLessonDraft] = useState<{ courseId: string; draft: LessonDraft } | null>(null)
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getCourses()
      .then((data) => {
        if (!cancelled) setCourses(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Runs a change, then reloads from the database so the screen always shows
  // what was actually saved. Any failure is shown at the top of the page.
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      setCourses(await getCourses())
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleCreateCourse = async () => {
    if (!newTitle.trim()) return setError('Give the course a title first.')
    const nextOrder = courses.length ? Math.max(...courses.map((c) => c.sort_order)) + 1 : 0
    let createdId: string | null = null
    const ok = await run(async () => {
      const course = await createCourse({ title: newTitle, description: newDescription, sort_order: nextOrder })
      createdId = course.id
    })
    if (ok) {
      setNewTitle('')
      setNewDescription('')
      setOpenCourseId(createdId)
    }
  }

  const handleSaveLesson = async () => {
    if (!lessonDraft) return
    const { courseId, draft } = lessonDraft
    if (!draft.title.trim()) return setError('Give the lesson a title first.')
    if (draft.video_url.trim() && !getVideoEmbedUrl(draft.video_url)) {
      return setError('That video link is not a YouTube or Vimeo link I can play. Paste the share link from YouTube or Vimeo.')
    }
    const minutes = draft.duration_minutes.trim() ? Number(draft.duration_minutes) : null
    if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) {
      return setError('Duration must be a number of minutes.')
    }
    const course = courses.find((c) => c.id === courseId)
    const existing = course?.course_lessons.find((l) => l.id === draft.id)
    const nextOrder = course?.course_lessons.length
      ? Math.max(...course.course_lessons.map((l) => l.sort_order)) + 1
      : 0
    const ok = await run(() =>
      saveLesson({
        id: draft.id,
        course_id: courseId,
        title: draft.title,
        description: draft.description,
        video_url: draft.video_url,
        duration_minutes: minutes === null ? null : Math.round(minutes),
        sort_order: existing ? existing.sort_order : nextOrder,
      })
    )
    if (ok) setLessonDraft(null)
  }

  const moveLesson = (course: CourseWithLessons, index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= course.course_lessons.length) return
    const ids = course.course_lessons.map((l) => l.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    run(() => reorderLessons(ids))
  }

  const handleUploadDocs = async (lesson: CourseLesson, files: FileList | null) => {
    if (!files?.length) return
    setUploadingLessonId(lesson.id)
    await run(async () => {
      for (const file of Array.from(files)) {
        await addLessonDocument(lesson, file.name.replace(/\.[^.]+$/, ''), file)
      }
    })
    setUploadingLessonId(null)
  }

  const openDocument = async (doc: LessonDocument) => {
    try {
      window.open(await getDocumentUrl(doc), '_blank', 'noopener')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <p className="text-sm text-[#64748b] py-8 text-center">Loading courses…</p>

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3 flex justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline flex-shrink-0">Dismiss</button>
        </div>
      )}

      {/* New course */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <p className="text-sm font-medium text-[#0f172a] mb-3">New course</p>
        <div className="flex flex-col gap-3">
          <Input label="Title" placeholder="e.g. Identity Reset — 21 Days" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description</label>
            <textarea className={fieldClass} rows={2} placeholder="What will the client get from this course?" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </div>
          <div>
            <Button onClick={handleCreateCourse} loading={busy}>Create course</Button>
          </div>
          <p className="text-xs text-[#94a3b8]">New courses start as drafts. Clients only see a course after you publish it.</p>
        </div>
      </div>

      {courses.length === 0 && (
        <p className="text-sm text-[#94a3b8] text-center py-6">No courses yet. Create your first one above.</p>
      )}

      {courses.map((course) => {
        const isOpen = openCourseId === course.id
        const isEditing = editingCourse?.id === course.id
        return (
          <div key={course.id} className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
            {/* Course header */}
            <div className="p-5 flex items-start justify-between gap-4">
              <button className="text-left flex-1 min-w-0" onClick={() => setOpenCourseId(isOpen ? null : course.id)}>
                <p className="text-base font-medium text-[#0f172a] truncate">{course.title}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {course.course_lessons.length} lesson{course.course_lessons.length === 1 ? '' : 's'} · {isOpen ? 'Hide' : 'Manage'}
                </p>
              </button>
              <PublishToggle
                published={course.is_published}
                disabled={busy}
                onChange={(next) => {
                  if (next && course.course_lessons.length === 0) {
                    return setError('Add at least one lesson before publishing this course.')
                  }
                  run(() => updateCourse(course.id, { is_published: next }))
                }}
              />
            </div>

            {isOpen && (
              <div className="border-t border-[#e2e8f0] p-5 bg-[#f8fafc] flex flex-col gap-4">
                {/* Course details */}
                {isEditing ? (
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-3">
                    <Input label="Title" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} />
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Description</label>
                      <textarea className={fieldClass} rows={3} value={editingCourse.description} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        loading={busy}
                        onClick={async () => {
                          if (!editingCourse.title.trim()) return setError('The course needs a title.')
                          const ok = await run(() =>
                            updateCourse(course.id, {
                              title: editingCourse.title.trim(),
                              description: editingCourse.description.trim() || null,
                            })
                          )
                          if (ok) setEditingCourse(null)
                        }}
                      >
                        Save
                      </Button>
                      <Button variant="back" onClick={() => setEditingCourse(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-[#64748b] whitespace-pre-wrap flex-1">{course.description || 'No description yet.'}</p>
                    <div className="flex gap-3 flex-shrink-0 text-xs">
                      <button className="text-[#4a7fd4] hover:underline" onClick={() => setEditingCourse({ id: course.id, title: course.title, description: course.description || '' })}>Edit details</button>
                      <button
                        className="text-[#ef4444] hover:underline"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Delete "${course.title}" with all its lessons, documents and client progress? This cannot be undone.`)) {
                            run(() => deleteCourse(course))
                          }
                        }}
                      >
                        Delete course
                      </button>
                    </div>
                  </div>
                )}

                {/* Lessons */}
                {course.course_lessons.map((lesson, index) => {
                  const draft = lessonDraft?.draft.id === lesson.id ? lessonDraft.draft : null
                  if (draft) {
                    return <LessonForm key={lesson.id} draft={draft} busy={busy} onChange={(d) => setLessonDraft({ courseId: course.id, draft: d })} onSave={handleSaveLesson} onCancel={() => setLessonDraft(null)} />
                  }
                  const docs = lesson.lesson_documents || []
                  return (
                    <div key={lesson.id} className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0f172a]">
                            <span className="text-[#94a3b8] mr-2">{index + 1}.</span>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-[#94a3b8] mt-1">
                            {lesson.video_url ? '🎬 Video linked' : '⚠ No video yet'}
                            {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
                            {` · ${docs.length} document${docs.length === 1 ? '' : 's'}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                          <button className="px-2 py-1 border border-[#e2e8f0] rounded disabled:opacity-30" disabled={busy || index === 0} onClick={() => moveLesson(course, index, -1)} aria-label="Move lesson up">↑</button>
                          <button className="px-2 py-1 border border-[#e2e8f0] rounded disabled:opacity-30" disabled={busy || index === course.course_lessons.length - 1} onClick={() => moveLesson(course, index, 1)} aria-label="Move lesson down">↓</button>
                          <button
                            className="text-[#4a7fd4] hover:underline"
                            onClick={() =>
                              setLessonDraft({
                                courseId: course.id,
                                draft: {
                                  id: lesson.id,
                                  title: lesson.title,
                                  description: lesson.description || '',
                                  video_url: lesson.video_url || '',
                                  duration_minutes: lesson.duration_minutes?.toString() || '',
                                },
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="text-[#ef4444] hover:underline"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`Delete lesson "${lesson.title}" and its documents?`)) run(() => deleteLesson(lesson))
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex flex-col gap-2">
                        {docs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between gap-3 text-xs">
                            <button className="text-[#0f172a] hover:text-[#4a7fd4] truncate text-left" onClick={() => openDocument(doc)}>📄 {doc.title}</button>
                            <button className="text-[#ef4444] hover:underline flex-shrink-0" disabled={busy} onClick={() => run(() => deleteLessonDocument(doc))}>Remove</button>
                          </div>
                        ))}
                        <label className="text-xs text-[#4a7fd4] cursor-pointer hover:underline w-fit">
                          {uploadingLessonId === lesson.id ? 'Uploading…' : '+ Add supporting documents'}
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            disabled={busy}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              handleUploadDocs(lesson, e.target.files)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}

                {/* New lesson */}
                {lessonDraft?.courseId === course.id && !lessonDraft.draft.id ? (
                  <LessonForm draft={lessonDraft.draft} busy={busy} onChange={(d) => setLessonDraft({ courseId: course.id, draft: d })} onSave={handleSaveLesson} onCancel={() => setLessonDraft(null)} />
                ) : (
                  <div>
                    <Button variant="secondary" onClick={() => setLessonDraft({ courseId: course.id, draft: EMPTY_LESSON })}>+ Add lesson</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LessonForm({
  draft,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  draft: LessonDraft
  busy: boolean
  onChange: (draft: LessonDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  const hasLink = draft.video_url.trim().length > 0
  const linkOk = hasLink && !!getVideoEmbedUrl(draft.video_url)
  return (
    <div className="bg-white border border-[#00D4E8] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-[#0f172a]">{draft.id ? 'Edit lesson' : 'New lesson'}</p>
      <Input label="Lesson title" value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <Input
        label="Video link (YouTube or Vimeo)"
        placeholder="https://youtu.be/…  or  https://vimeo.com/…"
        value={draft.video_url}
        onChange={(e) => onChange({ ...draft, video_url: e.target.value })}
        error={hasLink && !linkOk ? 'Not a YouTube or Vimeo link I can play' : undefined}
        hint={linkOk ? '✓ Link recognised — it will play inside the app' : 'Unlisted videos work. Leave empty for a documents-only lesson.'}
      />
      <Input label="Length in minutes (optional)" type="number" min={0} value={draft.duration_minutes} onChange={(e) => onChange({ ...draft, duration_minutes: e.target.value })} />
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notes for the client (optional)</label>
        <textarea className={fieldClass} rows={3} value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} loading={busy}>Save lesson</Button>
        <Button variant="back" onClick={onCancel}>Cancel</Button>
      </div>
      {!draft.id && <p className="text-xs text-[#94a3b8]">Save the lesson first, then attach supporting documents to it.</p>}
    </div>
  )
}
