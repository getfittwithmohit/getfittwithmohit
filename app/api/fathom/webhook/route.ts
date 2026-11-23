import { NextRequest, NextResponse, after } from 'next/server'
import { verifyFathomSignature, type FathomMeeting } from '@/lib/fathom/api'
import { handleFathomMeeting } from '@/lib/callNotes/process'

// Fathom "New meeting content ready" webhook. Verifies the signature, answers
// Fathom straight away, then matches the client and writes the draft notes in
// the background. Nothing reaches a client until the coach saves it.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const secret = process.env.FATHOM_WEBHOOK_SECRET
  if (!secret) {
    console.error('Fathom webhook: FATHOM_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const raw = await req.text()
  const ok = verifyFathomSignature(raw, {
    id: req.headers.get('webhook-id'),
    timestamp: req.headers.get('webhook-timestamp'),
    signature: req.headers.get('webhook-signature'),
  }, secret)
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  let meeting: FathomMeeting
  try {
    meeting = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  after(async () => {
    try {
      await handleFathomMeeting(meeting)
    } catch (e) {
      console.error('Fathom webhook processing failed', meeting.recording_id, e)
    }
  })

  return NextResponse.json({ received: true })
}
