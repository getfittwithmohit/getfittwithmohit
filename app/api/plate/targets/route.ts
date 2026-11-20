import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse } from '@/lib/supabase/serverAuth'
import { getTargets, requirePlateUser, supabaseAdmin } from '@/lib/plate/server'
import { targetsRequestSchema } from '@/lib/validation/plate'

// Sets your own daily targets — only used when the Fat Loss Blueprint can't
// be worked out (the coach, or a client missing height/weight).
export async function POST(req: NextRequest) {
  try {
    const user = await requirePlateUser()
    const { source } = await getTargets(user)
    if (source === 'blueprint') {
      return NextResponse.json(
        { error: 'Your targets come from your Fat Loss Blueprint. Ask Mohit if they need changing.' },
        { status: 409 }
      )
    }

    const parsed = targetsRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check your numbers' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('plate_targets')
      .upsert({ user_id: user.userId, ...parsed.data, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)

    return NextResponse.json({ targets: parsed.data, targetSource: 'custom' })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('PEAK Plate targets error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Could not save your targets' }, { status: 500 })
  }
}
