import { z } from 'zod'

const note = z.string().trim().max(500).optional().nullable()

// Shared by the form (client-side) and /api/daily-checkin (server-side).
export const dailyCheckinSchema = z
  .object({
    workout_status: z.enum(['done', 'modified', 'skipped'], { message: 'Tell us how your workout went' }),
    workout_note: note,
    nutrition_score: z.number({ message: 'Rate your nutrition' }).int().min(1).max(10),
    nutrition_note: note,
    steps: z.number({ message: 'Enter your steps' }).int().min(0).max(200000),
    sleep_hours: z.number({ message: 'Enter your sleep hours' }).min(0).max(24),
    sleep_quality: z.number({ message: 'Rate your sleep quality' }).int().min(1).max(10),
    energy: z.number({ message: 'Rate your energy' }).int().min(1).max(10),
    water_litres: z.number({ message: 'Enter your water intake' }).min(0).max(20),
    goal_writing_done: z.boolean(),
    affirmations_done: z.boolean(),
    gratitude_done: z.boolean(),
    support_needed: z.boolean(),
    support_message: note,
  })
  .refine((v) => v.workout_status === 'done' || !!v.workout_note?.trim(), {
    path: ['workout_note'],
    message: 'One line on why — it helps your coach adjust',
  })
  .refine((v) => !v.support_needed || !!v.support_message?.trim(), {
    path: ['support_message'],
    message: 'Tell your coach what you need',
  })

export type DailyCheckinInput = z.infer<typeof dailyCheckinSchema>
