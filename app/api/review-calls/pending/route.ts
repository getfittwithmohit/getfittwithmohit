import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('review_calls')
      .select('client_id, week_number, status')
      .eq('status', 'pending')
      .order('week_number', { ascending: true })

    if (error) throw error

    // Keep only the earliest pending week per client
    const pendingMap: Record<string, number> = {}
    for (const row of data || []) {
      if (!(row.client_id in pendingMap)) {
        pendingMap[row.client_id] = row.week_number
      }
    }

    return NextResponse.json({ pending: pendingMap })
  } catch (err: any) {
    console.error('Pending fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}