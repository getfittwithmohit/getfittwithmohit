import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { notifyCoach } from '@/lib/email/send'
import { checkinNotificationEmail } from '@/lib/email/templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Get client name
    let clientName = 'A client'
    if (body.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('full_name, current_week')
        .eq('id', body.client_id)
        .single()

      if (client) {
        clientName = client.full_name
      }
    }

    // Send notification to coach
    const email = checkinNotificationEmail({
      full_name: clientName,
      week_number: body.week_number || 0,
      workouts_completed: body.workouts_completed || 0,
      nutrition_adherence: body.nutrition_adherence || 0,
      energy_level: body.energy_level || 0,
      mood: body.mood || '',
      biggest_win: body.biggest_win || '',
      biggest_challenge: body.biggest_challenge || '',
      needs_from_coach: body.needs_from_coach || [],
    })

    notifyCoach(email.subject, email.html).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Checkin notification error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}