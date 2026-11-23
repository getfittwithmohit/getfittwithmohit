import { NextRequest, NextResponse } from 'next/server'
import { AuthError, requireCoach, authErrorResponse } from '@/lib/supabase/serverAuth'
import { assignDraft, db, generateDraft } from '@/lib/callNotes/process'

export const maxDuration = 60

const isMissingTable = (e: { code?: string } | null) => e?.code === '42P01' || e?.code === 'PGRST205'

// GET ?clientId=…  → that client's drafts (newest first)
// GET              → the coach's inbox: ready drafts + calls to assign
export async function GET(req: NextRequest) {
  try {
    await requireCoach()
    const clientId = req.nextUrl.searchParams.get('clientId')
    let q = db.from('call_note_drafts').select('*, clients(full_name)').order('meeting_at', { ascending: false, nullsFirst: false })
    q = clientId
      ? q.eq('client_id', clientId).in('status', ['processing', 'draft', 'error', 'applied']).limit(10)
      : q.in('status', ['processing', 'draft', 'unmatched', 'error']).limit(30)
    const { data, error } = await q
    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ drafts: [], setupNeeded: true })
      throw error
    }
    return NextResponse.json({ drafts: data || [] })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    return NextResponse.json({ error: (err as { message?: string })?.message || 'Something went wrong' }, { status: 500 })
  }
}

// POST { action: 'paste', clientId, weekNumber, transcript }
// POST { action: 'assign', draftId, clientId, weekNumber? }
// POST { action: 'retry', draftId }      (re-reads the Fathom transcript)
// POST { action: 'applied' | 'dismiss', draftId }
export async function POST(req: NextRequest) {
  try {
    await requireCoach()
    const body = await req.json()
    const now = new Date().toISOString()

    if (body.action === 'paste') {
      const { clientId, weekNumber, transcript } = body
      if (!clientId || !weekNumber || !transcript?.trim()) {
        return NextResponse.json({ error: 'Paste the transcript first.' }, { status: 400 })
      }
      const { data: row, error } = await db.from('call_note_drafts').insert({
        source: 'paste', client_id: clientId, week_number: weekNumber, meeting_at: now, status: 'processing',
      }).select('id').single()
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: 'Run supabase/fathom_call_notes.sql in Supabase first.' }, { status: 503 })
        }
        throw error
      }
      const draft = await generateDraft(row.id, String(transcript).slice(0, 120_000))
      return NextResponse.json({ draft })
    }

    const { draftId } = body
    if (!draftId) return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })

    if (body.action === 'assign' || body.action === 'retry') {
      let clientId = body.clientId
      let week = body.weekNumber
      if (body.action === 'retry') {
        const { data } = await db.from('call_note_drafts').select('client_id, week_number').eq('id', draftId).single()
        clientId = data?.client_id
        week = data?.week_number
      }
      if (!clientId) return NextResponse.json({ error: 'Pick a client first.' }, { status: 400 })
      const draft = await assignDraft(draftId, clientId, week || undefined)
      return NextResponse.json({ draft })
    }

    if (body.action === 'applied' || body.action === 'dismiss') {
      const status = body.action === 'applied' ? 'applied' : 'dismissed'
      const patch: Record<string, unknown> = { status, updated_at: now }
      if (body.action === 'applied' && body.weekNumber) patch.week_number = body.weekNumber
      const { error } = await db.from('call_note_drafts').update(patch).eq('id', draftId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('call-notes error', err)
    return NextResponse.json({ error: (err as { message?: string })?.message || 'Something went wrong' }, { status: 500 })
  }
}
