import { NextRequest, NextResponse } from 'next/server'
import { backfillReviewCallsForAllClients } from '@/lib/supabase/queries/reviewCalls'

export async function GET(req: NextRequest) {
  // Verify this is actually coming from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await backfillReviewCallsForAllClients()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('Cron backfill error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}