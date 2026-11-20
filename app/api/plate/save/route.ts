import { NextRequest, NextResponse } from 'next/server'
import { AuthError, authErrorResponse } from '@/lib/supabase/serverAuth'
import { requirePlateUser, supabaseAdmin } from '@/lib/plate/server'
import { saveRequestSchema, type PlateItem } from '@/lib/validation/plate'
import { totalsFor } from '@/lib/utils/plate'

// Saves a scanned meal to today's log, with any portion corrections.
// Totals are recomputed here from the stored per-unit values.
export async function POST(req: NextRequest) {
  try {
    const user = await requirePlateUser()
    const parsed = saveRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }
    const { scanId, mealType, quantities } = parsed.data

    const { data: scan } = await supabaseAdmin
      .from('meal_logs')
      .select('id, items')
      .eq('id', scanId)
      .eq('user_id', user.userId)
      .maybeSingle()
    if (!scan) return NextResponse.json({ error: 'That meal could not be found' }, { status: 404 })

    const items = (scan.items as PlateItem[])
      .map((item, i) => ({ ...item, quantity: quantities[i] ?? item.quantity }))
      .filter((item) => item.quantity > 0)
    if (!items.length) return NextResponse.json({ error: 'Add at least one item back first' }, { status: 400 })

    const { data: saved, error } = await supabaseAdmin
      .from('meal_logs')
      .update({
        items,
        ...totalsFor(items),
        meal_type: mealType,
        logged: true,
        logged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scan.id)
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ meal: saved })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('PEAK Plate save error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Could not save this meal' }, { status: 500 })
  }
}
