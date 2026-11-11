import { z } from 'zod'
import { PEAK_TOPICS, PEAK_TRIGGERS } from '@/lib/constants/peakIdeas'

export const generateRequestSchema = z
  .object({
    mode: z.enum(['original', 'book']),
    count: z.number().int().min(1).max(10),
    topic: z.enum(PEAK_TOPICS).nullable().optional(),
    focus: z.string().trim().max(500).nullable().optional(),
    book: z
      .object({ title: z.string().trim().min(1).max(200), author: z.string().trim().min(1).max(120) })
      .nullable()
      .optional(),
  })
  .refine((v) => v.mode === 'original' || !!v.book, { message: 'Book title and author are required', path: ['book'] })

export type GenerateRequest = z.infer<typeof generateRequestSchema>

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

export const generatedIdeaSchema = z.object({
  topic: z.enum(PEAK_TOPICS),
  hook: z.string().trim().min(5).max(160),
  body: z.string().trim().min(40).max(1200),
  action: z.string().trim().min(5).max(200),
  easier_action: z.string().trim().min(3).max(160),
  coach_take: z.string().trim().max(260).nullable().optional().transform((v) => v || null),
  recall_question: z.string().trim().min(5).max(200),
  recall_options: z.array(z.string().trim().min(1).max(120)).length(3),
  recall_answer: z.number().int().min(0).max(2),
  // unknown triggers are dropped rather than failing the whole idea
  triggers: z
    .array(z.string())
    .default([])
    .transform((t) => t.filter((x): x is (typeof PEAK_TRIGGERS)[number] => (PEAK_TRIGGERS as readonly string[]).includes(x)).slice(0, 2)),
  quality_score: z.number().int().min(1).max(10).optional().default(8),
})

export type GeneratedIdeaParsed = z.infer<typeof generatedIdeaSchema>

// Soft checks the editor should already meet; ideas far outside are dropped.
export function withinLimits(i: GeneratedIdeaParsed): boolean {
  return words(i.hook) <= 20 && words(i.body) <= 130 && words(i.action) <= 26
}
