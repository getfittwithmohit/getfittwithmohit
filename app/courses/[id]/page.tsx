'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import {
  getCompletedLessonIds,
  getCourse,
  getDocumentUrl,
  setLessonCompleted,
} from '@/lib/supabase/queries/content'
import { getVideoEmbedUrl } from '@/lib/utils/video'
import type { CourseWithLessons, LessonDocument } from '@/lib/types/content'

export default function CourseDetailPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseWithLessons | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [data, done] = await Promise.all([getCourse(courseId), getCompletedLessonIds(client.id)])
        setCourse(data)
        setCompleted(done)
        // Open on the first lesson the client hasn't finished yet
        const next = data?.course_lessons.find((l) => !done.has(l.id)) || data?.course_lessons[0]
        setOpenLessonId(next?.id || null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client, clientLoading, courseId])

  const toggleComplete = async (lessonId: string) => {
    if (!client || !course) return
    const nowComplete = !completed.has(lessonId)
    setSavingLessonId(lessonId)
    setError(null)
    try {
      await setLessonCompleted(client.id, lessonId, nowComplete)
      const next = new Set(completed)
      if (nowComplete) next.add(lessonId)
      else next.delete(lessonId)
      setCompleted(next)
      if (nowComplete) {
        // Move straight on to the next unfinished lesson
        const index = course.course_lessons.findIndex((l) => l.id === lessonId)
        const upcoming = course.course_lessons.slice(index + 1).find((l) => !next.has(l.id))
        if (upcoming) setOpenLessonId(upcoming.id)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingLessonId(null)
    }
  }

  const openDocument = async (doc: LessonDocument) => {
    // Open the tab immediately (inside the click) so mobile browsers don't
    // block it as a pop-up, then point it at the file once the link is ready.
    const tab = window.open('', '_blank')
    try {
      const url = await getDocumentUrl(doc)
      if (tab) tab.location.assign(url)
      else window.location.assign(url)
    } catch (err) {
      tab?.close()
      setError((err as Error).message)
    }
  }

  if (checking || clientLoading || loading) return <PageLoader />

  const lessons = course?.course_lessons || []
  const doneCount = lessons.filter((l) => completed.has(l.id)).length
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.location.href = '/courses'}
            className="text-white/40 hover:text-white/70 text-xs transition-colors mb-3"
          >
            ← All courses
          </button>
          <h1 className="text-white text-lg font-medium">{course?.title || 'Course'}</h1>
          {course && (
            <>
              <p className="text-white/50 text-xs mt-1">{doneCount} of {lessons.length} lessons complete · {percent}%</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#00D4E8] rounded-full transition-all" style={{ width: `${percent}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {!error && !course && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-[#0f172a]">This course isn&apos;t available</p>
            <p className="text-xs text-[#94a3b8] mt-1">It may have been removed or is not published yet.</p>
          </div>
        )}

        {course?.description && (
          <p className="text-sm text-[#64748b] whitespace-pre-wrap mb-1">{course.description}</p>
        )}

        {lessons.map((lesson, index) => {
          const isOpen = openLessonId === lesson.id
          const isDone = completed.has(lesson.id)
          const embedUrl = getVideoEmbedUrl(lesson.video_url)
          const docs = lesson.lesson_documents || []
          return (
            <div key={lesson.id} className={`bg-white border rounded-2xl overflow-hidden ${isOpen ? 'border-[#00D4E8]' : 'border-[#e2e8f0]'}`}>
              <button
                onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    isDone ? 'bg-[#22c55e] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[#0f172a]">{lesson.title}</span>
                  <span className="block text-xs text-[#94a3b8] mt-0.5">
                    {[
                      lesson.duration_minutes ? `${lesson.duration_minutes} min` : null,
                      docs.length ? `${docs.length} document${docs.length === 1 ? '' : 's'}` : null,
                    ].filter(Boolean).join(' · ') || 'Lesson'}
                  </span>
                </span>
                <span className="text-[#94a3b8] text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-4">
                  {/* Video — only mounted while the lesson is open, so closing it stops playback */}
                  {embedUrl ? (
                    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={embedUrl}
                        title={lesson.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  ) : lesson.video_url ? (
                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4a7fd4] underline"
                    >
                      ▶ Open the lesson video
                    </a>
                  ) : null}

                  {lesson.description && (
                    <p className="text-sm text-[#64748b] whitespace-pre-wrap leading-relaxed">{lesson.description}</p>
                  )}

                  {docs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">Supporting documents</p>
                      <div className="flex flex-col gap-2">
                        {docs.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => openDocument(doc)}
                            className="flex items-center gap-2 text-sm text-[#0f172a] border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-left hover:border-[#00D4E8] transition-colors"
                          >
                            <span>📄</span>
                            <span className="flex-1 truncate">{doc.title}</span>
                            <span className="text-xs text-[#94a3b8]">Open</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => toggleComplete(lesson.id)}
                    disabled={savingLessonId === lesson.id}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                      isDone
                        ? 'border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                        : 'bg-[#00D4E8] text-[#1a1f3a] hover:bg-[#00BED1]'
                    }`}
                  >
                    {savingLessonId === lesson.id ? 'Saving…' : isDone ? '✓ Completed — tap to undo' : 'Mark lesson complete ✓'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
