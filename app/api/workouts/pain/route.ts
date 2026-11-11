import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, requireOwnClientOrCoach, authErrorResponse } from '@/lib/supabase/serverAuth'
import { notifyCoach } from '@/lib/email/send'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))

// A client tapped "Felt pain" during a workout. Saves the report and emails
// the coach straight away — this is a safety signal, not a stat.
export async function POST(req: NextRequest) {
  try {
    const { clientId, logId, exerciseId, note } = await req.json()
    if (!clientId || !exerciseId) {
      return NextResponse.json({ error: 'Missing client or exercise' }, { status: 400 })
    }
    await requireOwnClientOrCoach(clientId)

    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : ''

    if (logId) {
      const { data: log } = await supabaseAdmin.from('workout_logs').select('client_id').eq('id', logId).maybeSingle()
      if (!log || log.client_id !== clientId) {
        return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
      }
    }

    const { error } = await supabaseAdmin.from('workout_pain_flags').insert({
      client_id: clientId,
      log_id: logId || null,
      exercise_id: exerciseId,
      note: cleanNote || null,
    })
    if (error) throw error

    const [{ data: client }, { data: exercise }] = await Promise.all([
      supabaseAdmin.from('clients').select('full_name, phone').eq('id', clientId).single(),
      supabaseAdmin.from('exercises').select('name').eq('id', exerciseId).single(),
    ])

    const coachNotified = await notifyCoach(
      `⚠️ Pain reported — ${client?.full_name || 'A client'} (${exercise?.name || 'exercise'})`,
      `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px;">${escapeHtml(client?.full_name || 'A client')} felt pain during a workout</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 16px;">Exercise: <strong>${escapeHtml(exercise?.name || 'Unknown')}</strong></p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#0f172a;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(cleanNote || 'No details given.')}</div>
        ${client?.phone ? `<p style="color:#64748b;font-size:13px;margin:16px 0 0;">Phone: ${escapeHtml(client.phone)}</p>` : ''}
      </div>`
    )
    if (!coachNotified) console.error('Pain email to coach failed for client', clientId)

    return NextResponse.json({ success: true, coachNotified })
  } catch (error: unknown) {
    if (error instanceof AuthError) return authErrorResponse(error)
    console.error('Pain report error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send the report' }, { status: 500 })
  }
}
