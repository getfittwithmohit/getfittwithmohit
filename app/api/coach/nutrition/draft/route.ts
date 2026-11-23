import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { currentTotals, draftFromIntake, loadClientFacts, loadFoods } from '@/lib/nutrition/ai'
import { dayTotals, type Level, type PlanTargets } from '@/lib/nutrition/plan'

// Coach only: draft a client's plan from what they already eat (food log), plus
// an optional call transcript and the coach's own instructions. Nothing is
// saved here — the coach reviews the result and creates the draft from it.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json()
    const clientId = String(body.clientId || '')
    const mealLog = String(body.mealLog || '')
    if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })
    if (mealLog.trim().length < 40) {
      return NextResponse.json({ error: 'Paste what they eat in a day (at least a few meals).' }, { status: 400 })
    }
    const level = ([1, 2, 3].includes(Number(body.level)) ? Number(body.level) : 1) as Level

    const [foods, { facts, targets: bp }] = await Promise.all([loadFoods(), loadClientFacts(clientId)])
    const targets: PlanTargets = body.targets || bp || { kcal: 1800, protein_g: 100, carbs_g: 200, fat_g: 60, fibre_g: 30, water_l: 3 }

    const result = await draftFromIntake({
      foods, facts, targets, level, mealLog,
      transcript: String(body.transcript || ''), notes: String(body.notes || ''),
    })
    const bySlug = new Map(foods.map((f) => [f.slug, f]))
    return NextResponse.json({
      ...result,
      currentTotals: currentTotals(result.current.meals, bySlug),
      planTotals: dayTotals(result.plan, bySlug).typical,
      targetsSource: body.targets ? 'coach' : bp ? 'blueprint' : 'default',
    })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('nutrition draft error', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
