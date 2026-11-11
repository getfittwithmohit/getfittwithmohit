import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, requireOwnClientOrCoach, authErrorResponse } from '@/lib/supabase/serverAuth'
import { notifyCoach } from '@/lib/email/send'
import { dailyCheckinSchema } from '@/lib/validation/dailyCheckin'
import { addDaysIST, formatDayLabel, todayIST } from '@/lib/utils/istDate'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))

// Saves a client's daily check-in.
//
// Rules (also why clients can't write the table directly):
//   - Only today or yesterday (India time) can be submitted.
//   - Today's entry can be edited until midnight; the original submitted_at
//     is kept, so editing never changes whether it was on time.
//   - Yesterday's entry can be added late (e.g. next morning) but not edited,
//     and earns no XP — the database only scores on-time entries.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientId: string | undefined = body.clientId
    const date: string | undefined = body.date
    if (!clientId || !date) {
      return NextResponse.json({ error: 'Missing clientId or date' }, { status: 400 })
    }

    const { isCoach } = await requireOwnClientOrCoach(clientId)
    if (isCoach) {
      return NextResponse.json({ error: 'Daily check-ins are submitted by the client' }, { status: 403 })
    }

    const today = todayIST()
    const yesterday = addDaysIST(today, -1)
    if (date !== today && date !== yesterday) {
      return NextResponse.json(
        { error: 'You can only check in for today, or yesterday if you missed it.' },
        { status: 400 }
      )
    }

    const parsed = dailyCheckinSchema.safeParse(body.answers)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Some answers are missing', issues: parsed.error.issues },
        { status: 400 }
      )
    }
    const answers = parsed.data

    const { data: existing, error: readError } = await supabaseAdmin
      .from('daily_checkins')
      .select('id, support_needed, support_message')
      .eq('client_id', clientId)
      .eq('checkin_date', date)
      .maybeSingle()
    if (readError) throw readError

    if (existing && date !== today) {
      return NextResponse.json(
        { error: "Yesterday's check-in is already in and can't be changed now." },
        { status: 409 }
      )
    }

    const row = {
      client_id: clientId,
      checkin_date: date,
      workout_status: answers.workout_status,
      workout_note: answers.workout_status === 'done' ? null : answers.workout_note?.trim() || null,
      nutrition_score: answers.nutrition_score,
      nutrition_note: answers.nutrition_note?.trim() || null,
      steps: answers.steps,
      sleep_hours: answers.sleep_hours,
      sleep_quality: answers.sleep_quality,
      energy: answers.energy,
      water_litres: answers.water_litres,
      gratitude_done: answers.gratitude_done,
      support_needed: answers.support_needed,
      support_message: answers.support_needed ? answers.support_message?.trim() || null : null,
      updated_at: new Date().toISOString(),
    }

    const { data: saved, error: saveError } = existing
      ? await supabaseAdmin.from('daily_checkins').update(row).eq('id', existing.id).select().single()
      : await supabaseAdmin.from('daily_checkins').insert(row).select().single()
    if (saveError) throw saveError

    // Email the coach when support is newly requested (or the request changed)
    let coachNotified: boolean | null = null
    const supportIsNew =
      row.support_needed &&
      (!existing?.support_needed || existing.support_message !== row.support_message)
    if (supportIsNew) {
      if (existing?.support_needed) {
        // Re-opened with a new message — make sure it shows as unresolved again
        await supabaseAdmin.from('daily_checkins').update({ support_resolved: false }).eq('id', saved.id)
      }
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('full_name, phone')
        .eq('id', clientId)
        .single()
      const name = escapeHtml(client?.full_name || 'A client')
      coachNotified = await notifyCoach(
        `🆘 Support needed — ${client?.full_name || 'A client'}`,
        `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px;">${name} asked for support</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">Daily check-in · ${escapeHtml(formatDayLabel(date))}</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#0f172a;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(row.support_message || '')}</div>
          <p style="color:#64748b;font-size:13px;margin:16px 0 0;">
            Workout: ${row.workout_status} · Nutrition: ${row.nutrition_score}/10 · Energy: ${row.energy}/10 · Sleep: ${row.sleep_hours}h
            ${client?.phone ? `<br/>Phone: ${escapeHtml(client.phone)}` : ''}
          </p>
        </div>`
      )
      if (!coachNotified) console.error('Support email to coach failed for client', clientId)
    }

    return NextResponse.json({ success: true, checkin: saved, onTime: date === today, coachNotified })
  } catch (error: unknown) {
    if (error instanceof AuthError) return authErrorResponse(error)
    console.error('Daily check-in error:', error)
    const message = error instanceof Error ? error.message : 'Could not save your check-in'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
