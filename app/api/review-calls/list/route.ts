import { NextRequest, NextResponse } from 'next/server'
import { getReviewCallsForClient } from '@/lib/supabase/queries/reviewCalls'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }
  try {
    const calls = await getReviewCallsForClient(clientId)
    return NextResponse.json({ calls })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}