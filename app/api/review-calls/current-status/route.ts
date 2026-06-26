import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data: clients, error: clientsErr } = await supabaseAdmin
      .from('clients')
      .select('id, current_week')
      .neq('phase', 'Onboarding')

    if (clientsErr) throw clientsErr

    const result: Record<string, {
      week: number
      status: string
      discussed: string
      changes: string
      next_focus: string
    }> = {}

    for (const client of clients || []) {
      if (!client.current_week) continue

      const { data: call } = await supabaseAdmin
        .from('review_calls')
        .select('status, discussed, changes, next_focus')
        .eq('client_id', client.id)
        .eq('week_number', client.current_week)
        .maybeSingle()

      result[client.id] = {
        week: client.current_week,
        status: call?.status || 'pending',
        discussed: call?.discussed || '',
        changes: call?.changes || '',
        next_focus: call?.next_focus || '',
      }
    }

    return NextResponse.json({ current: result })
  } catch (err: any) {
    console.error('Current status fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}