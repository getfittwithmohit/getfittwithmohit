'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClient } from '@/hooks/useClient'
import { PageLoader } from '@/components/ui/PageLoader'
import { HomeButton } from '@/components/layout/HomeButton'
import { getCompletedLessonIds, getCourses } from '@/lib/supabase/queries/content'
import type { CourseWithLessons } from '@/lib/types/content'

export default function CoursesPage() {
  const { checking } = useAuthGuard()
  const { client, loading: clientLoading } = useClient()

  const [courses, setCourses] = useState<CourseWithLessons[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientLoading) return
    async function load() {
      try {
        if (!client) throw new Error('We could not find your client profile. Please sign out and sign in again.')
        const [courseList, done] = await Promise.all([getCourses(), getCompletedLessonIds(client.id)])
        setCourses(courseList)
        setCompleted(done)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client, clientLoading])

  if (checking || clientLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <HomeButton />
          <h1 className="text-white text-lg font-medium">Courses</h1>
          <p className="text-white/50 text-xs mt-1">Learn at your own pace · Your progress is saved</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ef4444] text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {!error && courses.length === 0 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center">
            <div className="text-3xl mb-2">🎓</div>
            <p className="text-sm font-medium text-[#0f172a]">No courses yet</p>
            <p className="text-xs text-[#94a3b8] mt-1">Coach Mohit is preparing your first course. Check back soon.</p>
          </div>
        )}

        {courses.map((course) => {
          const total = course.course_lessons.length
          const done = course.course_lessons.filter((l) => completed.has(l.id)).length
          const percent = total ? Math.round((done / total) * 100) : 0
          return (
            <button
              key={course.id}
              onClick={() => window.location.href = `/courses/${course.id}`}
              className="bg-white border border-[#e2e8f0] rounded-2xl p-5 text-left hover:border-[#00d4d4] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-[#0f172a]">{course.title}</p>
                  {course.description && (
                    <p className="text-sm text-[#64748b] mt-1 line-clamp-2">{course.description}</p>
                  )}
                </div>
                {total > 0 && done === total && (
                  <span className="text-xs font-medium text-[#16a34a] bg-[#22c55e]/10 px-2.5 py-1 rounded-full flex-shrink-0">✓ Completed</span>
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#94a3b8] mb-1.5">
                  <span>{done} of {total} lesson{total === 1 ? '' : 's'}</span>
                  <span>{percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4d4] rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
