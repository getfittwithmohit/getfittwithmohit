import { NextRequest, NextResponse } from 'next/server'
import { getReviewCallsForClient } from '@/lib/supabase/queries/reviewCalls'
import { AuthError, requireCoach, authErrorResponse } from '@/lib/supabase/serverAuth'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }
  try {
    await requireCoach()
    const calls = await getReviewCallsForClient(clientId)
    return NextResponse.json({ calls })
  } catch (err: any) {
    if (err instanceof AuthError) return authErrorResponse(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}