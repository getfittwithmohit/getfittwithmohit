import { NextResponse } from 'next/server'
import { backfillReviewCallsForAllClients } from '@/lib/supabase/queries/reviewCalls'

export async function POST() {
  try {
    const result = await backfillReviewCallsForAllClients()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('Backfill error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}