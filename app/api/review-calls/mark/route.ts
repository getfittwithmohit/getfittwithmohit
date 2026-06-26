import { NextRequest, NextResponse } from 'next/server'
import { markReviewCall } from '@/lib/supabase/queries/reviewCalls'

export async function POST(req: NextRequest) {
  try {
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
    console.error('Mark call error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}