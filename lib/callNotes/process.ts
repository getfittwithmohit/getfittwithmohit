import { createClient } from '@supabase/supabase-js'
import { fetchFathomTranscript, transcriptToText, type FathomMeeting } from '@/lib/fathom/api'
import { writeCallNotes, type CallContext } from './write'

// Server-only. Every caller has verified the request (Fathom signature, or
// requireCoach()), so this uses the service role.
export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface ClientRow {
  id: string
  email: string | null
  full_name: string | null
  start_date: string | null
  phase: string | null
  current_week: number | null
}

const COACH_EMAILS = [process.env.COACH_EMAIL, process.env.NEXT_PUBLIC_COACH_EMAIL, 'getfittwithmohit@gmail.com']
  .filter(Boolean)
  .map((e) => e!.toLowerCase())

// Programme week the call happened in (same rule as calcCurrentWeek, but at
// the meeting's date instead of today).
export function weekAt(c: Pick<ClientRow, 'start_date' | 'phase' | 'current_week'>, at: Date): number {
  if (c.phase === 'Onboarding' || !c.start_date) return c.current_week || 1
  const diff = Math.floor((at.getTime() - new Date(c.start_date).getTime()) / (7 * 24 * 3600 * 1000))
  return Math.max(1, diff + 1)
}

// The client is whoever on the invite (or among matched speakers) has the
// same email as a client in the app. Exactly one match, or none.
export function matchClient(emails: string[], clients: ClientRow[], exclude: string[]): ClientRow | null {
  const wanted = new Set(emails.map((e) => e.toLowerCase().trim()).filter((e) => e && !exclude.includes(e)))
  const hits = clients.filter((c) => c.email && wanted.has(c.email.toLowerCase().trim()))
  return hits.length === 1 ? hits[0] : null
}

export function meetingEmails(m: FathomMeeting): string[] {
  const set = new Set<string>()
  for (const i of m.calendar_invitees || []) if (i.email) set.add(i.email.toLowerCase())
  for (const t of m.transcript || []) {
    const e = t.speaker?.matched_calendar_invitee_email
    if (e) set.add(e.toLowerCase())
  }
  return [...set]
}

async function contextFor(clientId: string | null, week: number | null, coachName: string): Promise<CallContext> {
  const base: CallContext = {
    coach_name: coachName, client_first_name: null, week_number: week, phase: null,
    primary_goal: null, doing_this_for: null, previous_next_focus: null,
  }
  if (!clientId) return base
  const safe = async <T,>(p: PromiseLike<{ data: T | null }>): Promise<T | null> => {
    try { return (await p).data } catch { return null }
  }
  const [client, pledge, metrics, prev] = await Promise.all([
    safe(db.from('clients').select('full_name, phase').eq('id', clientId).maybeSingle()),
    safe(db.from('commitment_pledges').select('*').eq('client_id', clientId).limit(1).maybeSingle()),
    safe(db.from('body_metrics').select('primary_goal').eq('client_id', clientId).order('recorded_at', { ascending: true }).limit(1).maybeSingle()),
    safe(db.from('review_calls').select('week_number, next_focus').eq('client_id', clientId).not('next_focus', 'is', null)
      .lt('week_number', week ?? 9999).order('week_number', { ascending: false }).limit(1).maybeSingle()),
  ])
  const c = client as { full_name?: string; phase?: string } | null
  return {
    ...base,
    client_first_name: c?.full_name?.split(' ')[0] || null,
    phase: c?.phase || null,
    primary_goal: (metrics as { primary_goal?: string } | null)?.primary_goal || null,
    doing_this_for: (pledge as { doing_this_for?: string } | null)?.doing_this_for || null,
    previous_next_focus: (prev as { next_focus?: string } | null)?.next_focus || null,
  }
}

// Write the notes for a draft row and mark it ready ('draft') or 'error'.
export async function generateDraft(draftId: string, transcript: string, coachName = 'Mohit') {
  const { data: row } = await db.from('call_note_drafts').select('client_id, week_number').eq('id', draftId).single()
  try {
    const ctx = await contextFor(row?.client_id ?? null, row?.week_number ?? null, coachName)
    const notes = await writeCallNotes(transcript, ctx)
    const { data, error } = await db.from('call_note_drafts')
      .update({ ...notes, status: 'draft', error: null, updated_at: new Date().toISOString() })
      .eq('id', draftId).select('*').single()
    if (error) throw error
    return data
  } catch (e) {
    const message = (e as { message?: string })?.message || 'Could not write the notes.'
    await db.from('call_note_drafts').update({ status: 'error', error: message, updated_at: new Date().toISOString() }).eq('id', draftId)
    throw e
  }
}

// Fathom webhook → one draft row per recording (re-deliveries are ignored).
export async function handleFathomMeeting(m: FathomMeeting): Promise<void> {
  if (!m.recording_id) return
  const recordedBy = m.recorded_by?.email?.toLowerCase()
  const exclude = [...COACH_EMAILS, ...(recordedBy ? [recordedBy] : [])]
  const emails = meetingEmails(m)
  // Solo / internal recordings: nothing to file.
  if (!emails.some((e) => !exclude.includes(e))) return

  const at = new Date(m.recording_start_time || m.scheduled_start_time || m.created_at || Date.now())
  const { data: clients } = await db.from('clients').select('id, email, full_name, start_date, phase, current_week')
  const client = matchClient(emails, (clients || []) as ClientRow[], exclude)

  const { data: inserted, error } = await db.from('call_note_drafts').insert({
    source: 'fathom',
    fathom_recording_id: m.recording_id,
    client_id: client?.id ?? null,
    week_number: client ? weekAt(client, at) : null,
    meeting_title: m.meeting_title || m.title || null,
    meeting_at: at.toISOString(),
    recording_url: m.share_url || m.url || null,
    invitee_emails: emails,
    status: client ? 'processing' : 'unmatched',
  }).select('id').single()
  if (error) {
    if (error.code === '23505') return // already received this recording
    throw error
  }
  // Unmatched calls (could be a sales call) get no AI notes until the coach
  // assigns them to a client.
  if (!client) return

  const items = m.transcript?.length ? m.transcript : await fetchFathomTranscript(m.recording_id)
  await generateDraft(inserted.id, transcriptToText(items), m.recorded_by?.name?.split(' ')[0] || 'Mohit')
}

// Coach assigned an unmatched (or errored) Fathom call to a client.
export async function assignDraft(draftId: string, clientId: string, weekNumber?: number) {
  const { data: draft, error } = await db.from('call_note_drafts').select('*').eq('id', draftId).single()
  if (error || !draft) throw new Error('Call not found')
  const { data: client } = await db.from('clients').select('id, email, full_name, start_date, phase, current_week').eq('id', clientId).single()
  if (!client) throw new Error('Client not found')
  const week = weekNumber || weekAt(client as ClientRow, new Date(draft.meeting_at || Date.now()))
  await db.from('call_note_drafts')
    .update({ client_id: clientId, week_number: week, status: 'processing', error: null, updated_at: new Date().toISOString() })
    .eq('id', draftId)
  if (!draft.fathom_recording_id) throw new Error('This draft has no Fathom recording to read.')
  const items = await fetchFathomTranscript(draft.fathom_recording_id).catch(async (e) => {
    await db.from('call_note_drafts').update({ status: 'error', error: e.message }).eq('id', draftId)
    throw e
  })
  return generateDraft(draftId, transcriptToText(items))
}
