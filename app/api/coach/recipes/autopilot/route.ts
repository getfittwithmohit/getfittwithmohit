import { NextRequest, NextResponse, after } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { admin } from '@/lib/nutrition/ai'
import { autopilotStatus, runAutopilot } from '@/lib/nutrition/recipeAutopilot'

// Coach only.
//   GET                          → Autopilot status (live, waiting, plate coverage, book)
//   POST { action: 'run' }       → run one batch and return what it did
//   POST { action: 'kick' }      → run one batch in the background (after publishing a plan)
//   POST { action: 'toggle', on } → switch auto-publishing on/off
export const maxDuration = 300

const notSetUp = (e: unknown) => /recipe_settings|recipes|42P01|PGRST205/.test(String((e as Error)?.message || e))
const setupMsg = 'Recipes aren’t set up yet. Run supabase/recipes.sql in Supabase.'

export async function GET() {
  try {
    await requireCoach()
    return NextResponse.json(await autopilotStatus())
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    return NextResponse.json({ error: notSetUp(err) ? setupMsg : (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json().catch(() => ({}))
    if (body.action === 'toggle') {
      const { error } = await admin.from('recipe_settings').upsert({ id: 1, autopilot: !!body.on })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'kick') {
      after(async () => {
        try { await runAutopilot() } catch (e) { console.error('Recipe autopilot (kick) failed', e) }
      })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json(await runAutopilot())
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('Recipe autopilot error', err)
    return NextResponse.json({ error: notSetUp(err) ? setupMsg : (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
