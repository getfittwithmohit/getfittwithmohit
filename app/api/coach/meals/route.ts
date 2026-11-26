import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { admin } from '@/lib/nutrition/ai'
import { addDaysIST, todayIST } from '@/lib/utils/istDate'

// Coach only: a client's meal ticks for the last 7 days (today included).
export async function GET(req: NextRequest) {
  try {
    await requireCoach()
    const clientId = req.nextUrl.searchParams.get('clientId') || ''
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) return NextResponse.json({ error: 'Bad client' }, { status: 400 })
    const today = todayIST()
    const from = addDaysIST(today, -6)
    const { data, error } = await admin
      .from('meal_ticks')
      .select('tick_date, meal_id, meal_name, status, option_id, option_title, protein_g, kcal, plate_log_id')
      .eq('client_id', clientId)
      .gte('tick_date', from)
      .lte('tick_date', today)
    if (error) throw new Error(error.message)
    const days = Array.from({ length: 7 }, (_, i) => addDaysIST(from, i))
      .map((date) => ({ date, ticks: (data || []).filter((t) => t.tick_date === date) }))
    return NextResponse.json({ days })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
