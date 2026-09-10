import { NextRequest, NextResponse } from 'next/server'
import { markReviewCall } from '@/lib/supabase/queries/reviewCalls'
import { AuthError, requireCoach, authErrorResponse } from '@/lib/supabase/serverAuth'

export async function POST(req: NextRequest) {
  try {
    await requireCoach()

    const { clientId, weekNumber, status, discussed, changes, next_focus } = await req.json()

    if (!clientId || !weekNumber || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await markReviewCall(clientId, weekNumber, {
      status,
      discussed,
      changes,
      next_focus,
      call_date: new Date().toISOString().split('T')[0],
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('Mark call error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}