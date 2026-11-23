import { NextRequest, NextResponse, after } from 'next/server'
import { verifyFathomSignature, type FathomMeeting } from '@/lib/fathom/api'
import { handleFathomMeeting } from '@/lib/callNotes/process'

// Fathom "New meeting content ready" webhook. Verifies the signature, answers
// Fathom straight away, then matches the client and writes the draft notes in
// the background. Nothing reaches a client until the coach saves it.
export const maxDuration = 60

// Opening the URL in a browser: a quick setup check (never shows the values).
export async function GET() {
  const secret = !!process.env.FATHOM_WEBHOOK_SECRET
  const apiKey = !!process.env.FATHOM_API_KEY
  const ai = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    ok: secret && apiKey && ai,
    message: secret && apiKey && ai
      ? 'Fathom webhook is ready. Fathom sends calls here automatically; nothing to do in the browser.'
      : 'Fathom webhook is live but missing settings in Vercel (see below). Add them, then redeploy.',
    FATHOM_WEBHOOK_SECRET: secret ? 'set' : 'missing',
    FATHOM_API_KEY: apiKey ? 'set' : 'missing',
    ANTHROPIC_API_KEY: ai ? 'set' : 'missing',
  })
}

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
