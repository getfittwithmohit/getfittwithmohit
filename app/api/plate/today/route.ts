import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse } from '@/lib/supabase/serverAuth'
import { getScansUsedToday, getTargets, requirePlateUser, supabaseAdmin } from '@/lib/plate/server'
import { DAILY_SCAN_LIMIT, sumTotals } from '@/lib/utils/plate'
import { todayIST } from '@/lib/utils/istDate'

// Everything the PEAK Plate page needs on load: targets, today's logged
// meals and totals, and scans left today.
export async function GET() {
  try {
    const user = await requirePlateUser()
    const [{ targets, source }, used, mealsRes] = await Promise.all([
      getTargets(user),
      getScansUsedToday(user.userId),
      supabaseAdmin
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.userId)
        .eq('meal_date', todayIST())
        .eq('logged', true)
        .order('logged_at', { ascending: true }),
    ])
    if (mealsRes.error) throw new Error(mealsRes.error.message)
    const meals = mealsRes.data || []

    return NextResponse.json({
      targets,
      targetSource: source,
      meals,
      totals: sumTotals(meals),
      scansLeft: Math.max(0, DAILY_SCAN_LIMIT - used),
      isCoach: user.isCoach,
    })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('PEAK Plate today error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Could not load your plate' }, { status: 500 })
  }
}

// Removes a meal from the log (e.g. logged by mistake). The row is kept,
// un-logged, so it still counts towards today's scan cap.
export async function DELETE(req: NextRequest) {
  try {
    const user = await requirePlateUser()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('meal_logs')
      .update({ logged: false, logged_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('PEAK Plate remove error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Could not remove this meal' }, { status: 500 })
  }
}
