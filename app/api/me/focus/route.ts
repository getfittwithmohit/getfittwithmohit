import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/callNotes/process'

// The signed-in client's focus from their latest review call — only calls
// the coach chose to share (review_calls.share_focus), from the last 3 weeks.
// Only next_focus and changes are returned; the coach's own notes stay private.
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ focus: null }, { status: 401 })

    const { data: client } = await db.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
    if (!client) return NextResponse.json({ focus: null })

    const since = new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const { data, error } = await db.from('review_calls')
      .select('week_number, call_date, next_focus, changes')
      .eq('client_id', client.id)
      .eq('share_focus', true)
      .eq('status', 'completed')
      .gte('call_date', since)
      .not('next_focus', 'is', null)
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    // Before the migration runs there is no share_focus column: show nothing.
    if (error) return NextResponse.json({ focus: null })
    return NextResponse.json({ focus: data })
  } catch {
    return NextResponse.json({ focus: null })
  }
}
