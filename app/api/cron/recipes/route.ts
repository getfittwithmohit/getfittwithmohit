import { NextRequest, NextResponse } from 'next/server'
import { runAutopilot } from '@/lib/nutrition/recipeAutopilot'

// Daily Recipe Autopilot run (vercel.json cron). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the
// project's environment variables; without it this route does nothing.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await runAutopilot())
  } catch (err) {
    console.error('Recipe autopilot (cron) failed', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
