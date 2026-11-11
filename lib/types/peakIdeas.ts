import type { PeakTopic, PeakTrigger } from '@/lib/constants/peakIdeas'

export type IdeaStatus = 'draft' | 'approved' | 'archived'

export interface PeakIdea {
  id: string
  topic: PeakTopic
  kind: 'original' | 'book'
  book_title: string | null
  book_author: string | null
  book_order: number | null
  hook: string
  body: string
  action: string
  easier_action: string
  coach_take: string | null
  recall_question: string
  recall_options: string[]
  recall_answer: number
  triggers: PeakTrigger[]
  status: IdeaStatus
  quality_score: number | null
  created_at: string
  approved_at: string | null
}

export interface ClientIdea {
  id: string
  client_id: string
  idea_id: string
  day: string
  is_daily: boolean
  opened_at: string | null
  committed_at: string | null
  chose_easier: boolean
  outcome: 'done' | 'not_yet' | null
  outcome_at: string | null
  reaction: -1 | 1 | null
  saved_at: string | null
  created_at: string
  peak_ideas: PeakIdea
}

export interface Recall {
  id: string
  client_id: string
  idea_id: string
  step: 1 | 2
  due_date: string
  answered_at: string | null
  correct: boolean | null
  peak_ideas: PeakIdea
}

// What the AI writer returns for one idea (before it is saved as a draft)
export interface GeneratedIdea {
  topic: PeakTopic
  hook: string
  body: string
  action: string
  easier_action: string
  coach_take: string | null
  recall_question: string
  recall_options: string[]
  recall_answer: number
  triggers: PeakTrigger[]
  quality_score: number
}
