import { createHmac, timingSafeEqual } from 'crypto'

// Fathom (fathom.video) — webhook verification + the one API call we need.
// Docs: https://developers.fathom.ai/webhooks

export interface FathomTranscriptItem {
  speaker?: { display_name?: string | null; matched_calendar_invitee_email?: string | null }
  text?: string
  timestamp?: string
}

export interface FathomMeeting {
  title?: string | null
  meeting_title?: string | null
  url?: string | null
  share_url?: string | null
  created_at?: string | null
  scheduled_start_time?: string | null
  recording_start_time?: string | null
  recording_id?: number | null
  calendar_invitees?: { name?: string | null; email?: string | null; is_external?: boolean }[] | null
  recorded_by?: { name?: string | null; email?: string | null } | null
  transcript?: FathomTranscriptItem[] | null
}

// Signed content is `${webhook-id}.${webhook-timestamp}.${raw body}`, HMAC-SHA256
// with the base64-decoded part of the whsec_ secret; the header holds one or
// more space-separated `v1,<base64>` signatures.
export function verifyFathomSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  const { id, timestamp, signature } = headers
  if (!id || !timestamp || !signature || !secret) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false

  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest()

  return signature.split(' ').some((part) => {
    const sig = part.includes(',') ? part.slice(part.indexOf(',') + 1) : part
    const got = Buffer.from(sig, 'base64')
    return got.length === expected.length && timingSafeEqual(got, expected)
  })
}

export async function fetchFathomTranscript(recordingId: number): Promise<FathomTranscriptItem[]> {
  const key = process.env.FATHOM_API_KEY
  if (!key) throw new Error('FATHOM_API_KEY is not set in Vercel')
  const res = await fetch(`https://api.fathom.ai/external/v1/recordings/${recordingId}/transcript`, {
    headers: { 'X-Api-Key': key },
  })
  if (!res.ok) {
    console.error('Fathom transcript error', res.status, await res.text())
    throw new Error(
      res.status === 401 ? 'Fathom rejected the API key. Check FATHOM_API_KEY in Vercel.'
        : res.status === 429 ? 'Fathom is rate-limiting. Try again in a minute.'
        : `Couldn't get the transcript from Fathom (${res.status}).`
    )
  }
  const data = await res.json()
  return Array.isArray(data?.transcript) ? data.transcript : []
}

// "[00:12:04] Mohit: text" lines. Long calls are trimmed from the middle so the
// start (check-in) and end (agreed plan) both survive.
export function transcriptToText(items: FathomTranscriptItem[], maxChars = 120_000): string {
  const text = items
    .filter((t) => t.text?.trim())
    .map((t) => `[${t.timestamp || ''}] ${t.speaker?.display_name || 'Speaker'}: ${t.text!.trim()}`)
    .join('\n')
  if (text.length <= maxChars) return text
  const half = Math.floor(maxChars / 2)
  return `${text.slice(0, half)}\n[… middle of the call trimmed …]\n${text.slice(-half)}`
}
