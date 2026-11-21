'use client'

import { useEffect, useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { PeakIdeaCard } from '@/components/home/PeakIdeaCard'
import { Badge, Group, LargeTitle, Row, Screen, SectionTitle, Skeleton } from '@/components/ui/ios'
import { getAudioProgress, getAudios, getCompletedLessonIds, getCourses } from '@/lib/supabase/queries/content'
import type { Audio, CourseWithLessons } from '@/lib/types/content'

// Learn tab: today's PEAK Idea, courses with progress, audio and saved ideas.
export default function LearnPage() {
  const { checking } = useAuthGuard()
  const { client, loading } = useClient()
  const [courses, setCourses] = useState<CourseWithLessons[] | null>(null)
  const [doneLessons, setDoneLessons] = useState<Set<string>>(new Set())
  const [resume, setResume] = useState<{ audio: Audio; left: number } | null>(null)

  useEffect(() => {
    if (checking || loading || !client) return
    let cancelled = false
    Promise.all([getCourses(), getCompletedLessonIds(client.id)])
      .then(([c, done]) => { if (!cancelled) { setCourses(c); setDoneLessons(done) } })
      .catch(() => { if (!cancelled) setCourses([]) })
    Promise.all([getAudios(), getAudioProgress(client.id)])
      .then(([audios, progress]) => {
        if (cancelled) return
        const a = audios.find((x) => progress[x.id] && progress[x.id].position_seconds > 0 && !progress[x.id].completed)
        if (a) setResume({ audio: a, left: Math.max(1, Math.round(((a.duration_seconds || 0) - progress[a.id].position_seconds) / 60)) })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [checking, loading, client])

  if (checking || loading) return <PageLoader />

  return (
    <Screen>
      <LargeTitle eyebrow="Grow the mind" title="Learn" />

      {client && <PeakIdeaCard clientId={client.id} />}

      {resume && (
        <>
          <SectionTitle>Continue listening</SectionTitle>
          <Group>
            <Row icon="headphones" title={resume.audio.title} subtitle={resume.audio.duration_seconds ? `${resume.left} min left` : 'Pick up where you left off'} href="/audios" last />
          </Group>
        </>
      )}

      <SectionTitle>Courses</SectionTitle>
      {courses === null ? (
        <Skeleton h={130} />
      ) : courses.length === 0 ? (
        <Group><Row icon="grad" tint="slate" title="Courses" subtitle="New courses will appear here" href="/courses" last /></Group>
      ) : (
        <Group>
          {courses.map((c, i) => {
            const total = c.course_lessons.length
            const done = c.course_lessons.filter((l) => doneLessons.has(l.id)).length
            return (
              <Row
                key={c.id}
                icon="grad"
                title={c.title}
                subtitle={done === 0 ? `${total} lesson${total === 1 ? '' : 's'}` : done === total ? 'Completed' : 'In progress'}
                href={`/courses/${c.id}`}
                trailing={done === total && total > 0 ? <Badge tint="green">Done</Badge> : done > 0 ? <Badge tint="teal">{done} of {total}</Badge> : undefined}
                last={i === courses.length - 1}
              />
            )
          })}
        </Group>
      )}

      <SectionTitle>Library</SectionTitle>
      <Group>
        <Row icon="headphones" title="Audio library" subtitle="Audiobooks, talks, meditations" href="/audios" />
        <Row icon="bookmark" title="Saved ideas" subtitle="Your stash of PEAK Ideas" href="/ideas/stash" />
        <Row icon="book" title="Book ideas" subtitle="Big ideas from great books" href="/ideas/books" />
        <Row icon="refresh" title="Weekly recap" subtitle="Your ideas and promises this week" href="/ideas/recap" last />
      </Group>
    </Screen>
  )
}
