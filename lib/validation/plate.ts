import { z } from 'zod'

// PEAK Plate — shared shapes for the AI result, the API requests and the page.

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'] as const
export type MealType = (typeof MEAL_TYPES)[number]

const macro = z.coerce.number().min(0).max(5000)

export const plateItemSchema = z.object({
  name: z.string().trim().min(1).transform((s) => s.slice(0, 80)),
  unit: z.string().trim().min(1).transform((s) => s.slice(0, 30)),             // "roti", "katori", "piece", "g", "glass"
  quantity: z.coerce.number().min(0).max(50),
  per_unit: z.object({
    calories: macro,
    protein_g: macro,
    carbs_g: macro,
    fat_g: macro,
    fibre_g: macro,
  }),
})
export type PlateItem = z.infer<typeof plateItemSchema>

// What the AI must return (see lib/ai/plateMealPrompt.ts). Forgiving on
// purpose: over-long text is trimmed and extra list entries dropped, rather
// than failing the whole scan.
const clip = (max: number) => z.string().trim().transform((s) => s.slice(0, max))

export const plateAnalysisSchema = z.object({
  is_food: z.boolean(),
  title: clip(80).pipe(z.string().min(1)),
  emoji: z.string().trim().transform((s) => Array.from(s).slice(0, 2).join('') || '🍽️'),
  items: z.array(plateItemSchema).min(1).transform((a) => a.slice(0, 15)),
  score: z.coerce.number().transform((n) => Math.min(10, Math.max(1, Math.round(n)))),
  headline: clip(200),
  flags: z.array(z.object({ label: clip(40), detail: clip(200) })).transform((a) => a.slice(0, 4)),
  swaps: z.array(z.object({ change: clip(160), impact: clip(100) })).transform((a) => a.slice(0, 3)),
  assumptions: clip(300).optional().default(''),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
})
export type PlateAnalysis = z.infer<typeof plateAnalysisSchema>

const note = z.string().trim().max(200).optional().nullable()

export const analyzeRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('photo'),
    // JPEG data URL, already shrunk on the phone (~150 KB). Hard cap ~3 MB.
    image: z.string().startsWith('data:image/').max(4_000_000, 'That photo is too large — try again'),
    note,
    mealType: z.enum(MEAL_TYPES),
  }),
  z.object({
    mode: z.literal('text'),
    description: z.string().trim().min(3, 'Tell us what you ate').max(500),
    note,
    mealType: z.enum(MEAL_TYPES),
  }),
  z.object({
    mode: z.literal('recheck'),
    scanId: z.string().uuid(),
    quantities: z.array(z.number().min(0).max(50)).max(15),
  }),
])

export const saveRequestSchema = z.object({
  scanId: z.string().uuid(),
  mealType: z.enum(MEAL_TYPES),
  quantities: z.array(z.number().min(0).max(50)).max(15),
})

export const targetsRequestSchema = z.object({
  calories: z.number().int().min(800, 'Calories look too low').max(6000),
  protein_g: z.number().int().min(20).max(400),
  carbs_g: z.number().int().min(0).max(800),
  fat_g: z.number().int().min(10).max(300),
  fibre_g: z.number().int().min(5).max(100),
})
export type PlateTargets = z.infer<typeof targetsRequestSchema>
