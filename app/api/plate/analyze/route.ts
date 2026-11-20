import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse } from '@/lib/supabase/serverAuth'
import {
  PlateUserError,
  askClaudeAboutMeal,
  getScansUsedToday,
  getTargets,
  getTodayTotals,
  requirePlateUser,
  supabaseAdmin,
} from '@/lib/plate/server'
import { plateMealPrompt } from '@/lib/ai/plateMealPrompt'
import { analyzeRequestSchema, plateAnalysisSchema, type MealType, type PlateItem } from '@/lib/validation/plate'
import { DAILY_SCAN_LIMIT, formatQty, totalsFor, verdictFromScore } from '@/lib/utils/plate'
import { todayIST } from '@/lib/utils/istDate'

export const maxDuration = 60

// Scans a meal (photo or typed), or re-checks one after portion edits.
// The photo only passes through memory on its way to the AI — it is never
// written to storage or the database.
export async function POST(req: NextRequest) {
  try {
    const user = await requirePlateUser()

    const parsed = analyzeRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }
    const body = parsed.data

    const used = await getScansUsedToday(user.userId)
    if (used >= DAILY_SCAN_LIMIT) {
      return NextResponse.json(
        { error: `You've used all ${DAILY_SCAN_LIMIT} scans for today. They reset at midnight 🌙` },
        { status: 429 }
      )
    }

    // For a re-check, load the scan being corrected
    type ExistingScan = { id: string; items: PlateItem[]; meal_type: MealType; source: string; analyses: number }
    let existing: ExistingScan | null = null
    if (body.mode === 'recheck') {
      const { data } = await supabaseAdmin
        .from('meal_logs')
        .select('id, items, meal_type, source, analyses')
        .eq('id', body.scanId)
        .eq('user_id', user.userId)
        .maybeSingle()
      if (!data) return NextResponse.json({ error: 'That meal could not be found' }, { status: 404 })
      existing = data as ExistingScan
    }

    const mealType: MealType = body.mode === 'recheck' ? existing!.meal_type : body.mealType
    const [{ targets, source: targetSource }, eatenToday] = await Promise.all([
      getTargets(user),
      getTodayTotals(user.userId, existing?.id),
    ])

    let description: string | undefined
    if (body.mode === 'text') description = body.description
    if (body.mode === 'recheck') {
      const lines = existing!.items
        .map((item, i) => ({ item, q: body.quantities[i] ?? item.quantity }))
        .filter(({ q }) => q > 0)
        .map(({ item, q }) => `- ${item.name}: ${formatQty(q)} ${item.unit}`)
      if (!lines.length) return NextResponse.json({ error: 'Add at least one item back first' }, { status: 400 })
      description = lines.join('\n')
    }

    const prompt = plateMealPrompt({
      kind: body.mode,
      description,
      note: body.mode === 'recheck' ? null : body.note,
      mealType,
      targets,
      eatenToday,
    })
    const raw = await askClaudeAboutMeal(prompt, body.mode === 'photo' ? body.image : undefined)

    if (raw && typeof raw === 'object' && (raw as { is_food?: unknown }).is_food === false) {
      throw new PlateUserError("We couldn't spot any food in that. Try a clearer photo of your plate, or type what you ate.")
    }
    const result = plateAnalysisSchema.safeParse(raw)
    if (!result.success || !result.data.is_food) {
      console.error('PEAK Plate: invalid AI output', result.success ? 'is_food=false' : result.error.issues)
      throw new PlateUserError("We couldn't read this meal properly. Please try again — a closer, well-lit photo helps.")
    }
    const a = result.data
    const totals = totalsFor(a.items)

    const row = {
      title: a.title,
      emoji: a.emoji,
      items: a.items,
      ...totals,
      score: a.score,
      verdict: verdictFromScore(a.score),
      headline: a.headline,
      flags: a.flags,
      swaps: a.swaps,
      assumptions: a.assumptions || null,
      confidence: a.confidence,
      updated_at: new Date().toISOString(),
    }

    const { data: scan, error } = existing
      ? await supabaseAdmin
          .from('meal_logs')
          .update({ ...row, analyses: existing.analyses + 1 })
          .eq('id', existing.id)
          .select()
          .single()
      : await supabaseAdmin
          .from('meal_logs')
          .insert({
            ...row,
            user_id: user.userId,
            client_id: user.clientId,
            meal_date: todayIST(),
            meal_type: mealType,
            source: body.mode,
            logged: false,
          })
          .select()
          .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({
      scan,
      targets,
      targetSource,
      eatenToday,
      scansLeft: Math.max(0, DAILY_SCAN_LIMIT - used - 1),
    })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    if (err instanceof PlateUserError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error('PEAK Plate analyze error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
