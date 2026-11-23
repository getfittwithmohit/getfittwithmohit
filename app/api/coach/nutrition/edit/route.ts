import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { editPlan, loadClientFacts, loadFoods } from '@/lib/nutrition/ai'
import type { PlanDoc } from '@/lib/nutrition/plan'

// Coach only: change a plan from a plain-language instruction (optionally with
// a call transcript). Returns the proposed plan; the editor shows it as a
// before/after and nothing changes until the coach taps Apply.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json()
    const doc = body.doc as PlanDoc
    const instruction = String(body.instruction || '').trim()
    const transcript = String(body.transcript || '')
    if (!doc?.meals) return NextResponse.json({ error: 'Missing plan' }, { status: 400 })
    if (!instruction && !transcript.trim()) return NextResponse.json({ error: 'Type what to change, or paste call notes.' }, { status: 400 })

    const [foods, ctx] = await Promise.all([
      loadFoods(),
      body.clientId ? loadClientFacts(String(body.clientId)) : Promise.resolve(null),
    ])
    const result = await editPlan({
      foods, facts: ctx?.facts ?? null, doc, transcript, diet: body.diet ?? null,
      instruction: instruction || 'Update the plan using what was agreed in these call notes.',
    })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('nutrition edit error', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
