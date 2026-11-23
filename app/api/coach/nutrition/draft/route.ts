import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { currentTotals, draftFromIntake, loadClientFacts, loadFoods, type MealImage } from '@/lib/nutrition/ai'
import { dayTotals, type Level, type PlanTargets } from '@/lib/nutrition/plan'

// Coach only: draft a client's plan from what they already eat (meal photos
// and/or a typed food log), plus
// an optional call transcript and the coach's own instructions. Nothing is
// saved here — photos are read and discarded; the coach reviews the result and
// creates the draft from it.
export const maxDuration = 300
const MAX_IMAGES = 15

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json()
    const clientId = String(body.clientId || '')
    const mealLog = String(body.mealLog || '')
    if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })
    const images: MealImage[] = Array.isArray(body.images)
      ? body.images
          .filter((im: MealImage) => typeof im?.data === 'string' && /^image\/(jpeg|png|webp|gif)$/.test(im?.media_type))
          .slice(0, MAX_IMAGES)
          .map((im: MealImage) => ({ data: im.data, media_type: im.media_type, caption: String(im.caption || '').slice(0, 200) }))
      : []
    if (images.some((im) => im.data.length > 1_500_000)) {
      return NextResponse.json({ error: 'One of the photos is too large. Please try again.' }, { status: 400 })
    }
    if (mealLog.trim().length < 40 && images.length === 0) {
      return NextResponse.json({ error: 'Add photos of their meals, or paste what they eat in a day.' }, { status: 400 })
    }
    const level = ([1, 2, 3].includes(Number(body.level)) ? Number(body.level) : 1) as Level

    const [foods, { facts, targets: bp }] = await Promise.all([loadFoods(), loadClientFacts(clientId)])
    const targets: PlanTargets = body.targets || bp || { kcal: 1800, protein_g: 100, carbs_g: 200, fat_g: 60, fibre_g: 30, water_l: 3 }

    const result = await draftFromIntake({
      foods, facts, targets, level, mealLog,
      transcript: String(body.transcript || ''), notes: String(body.notes || ''), images,
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
