import type { AudioCategory } from '@/lib/constants/content'

export interface Course {
  id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LessonDocument {
  id: string
  lesson_id: string
  title: string
  file_path: string
  created_at: string
}

export interface CourseLesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  sort_order: number
  created_at: string
  lesson_documents?: LessonDocument[]
}

export interface CourseWithLessons extends Course {
  course_lessons: CourseLesson[]
}

export interface Audio {
  id: string
  title: string
  description: string | null
  category: AudioCategory
  collection: string | null
  sort_order: number
  file_path: string
  duration_seconds: number | null
  is_published: boolean
  created_at: string
}

export interface AudioProgress {
  audio_id: string
  position_seconds: number
  completed: boolean
}
