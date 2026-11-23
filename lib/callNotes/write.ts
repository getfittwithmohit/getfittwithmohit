// Weekly call notes — Claude turns a call transcript into the three call
// fields + a WhatsApp recap in Coach Mohit's voice. Drafts only: the coach
// reviews and saves them.

export interface CallNotes {
  discussed: string
  changes: string
  next_focus: string
  whatsapp_message: string
}

export interface CallContext {
  coach_name: string
  client_first_name: string | null
  week_number: number | null
  phase: string | null
  primary_goal: string | null
  doing_this_for: string | null
  previous_next_focus: string | null
}

const STR = { type: 'string' }
const SCHEMA = {
  type: 'object',
  properties: { discussed: STR, changes: STR, next_focus: STR, whatsapp_message: STR },
  required: ['discussed', 'changes', 'next_focus', 'whatsapp_message'],
  additionalProperties: false,
}

const MODEL = process.env.CALL_NOTES_MODEL || process.env.PEAK_PLATE_MODEL || 'claude-sonnet-5-5'

function prompt(transcript: string, c: CallContext) {
  return `You work with Coach Mohit (${c.coach_name} in the transcript), a 1:1 fitness transformation and peak-performance coach in India. Below is the transcript of his weekly review call with a client. Write his call notes and the WhatsApp recap he sends the client after the call.

His philosophy: workouts and diets are available everywhere; what he coaches is identity (who the client is becoming), habits, focus, time management and purpose.

CONTEXT
${JSON.stringify(c, null, 1)}

RULES
- Use ONLY what was said on the call (plus the context above). Never invent numbers, foods, plans or promises. If something wasn't agreed, don't write it.
- The call may mix English and Hindi; write everything in clear English.
- No medical diagnosis or treatment advice. If health issues came up, note them as "discussed" and any agreed action (e.g. "see doctor").
- Plain text. Lines start with "• ". Each line ≤ 20 words.

FIELDS
- discussed: coach's private notes, 3–6 bullet lines: how the week went, wins, struggles, anything personal that matters. Third person, using the client's first name.
- changes: 1–4 bullet lines of what changes in the plan (training, nutrition, routine, habits). Written to the client ("you"). If nothing changes, write "• No changes — keep the current plan".
- next_focus: 1–3 bullet lines, written to the client ("you"): the specific things to do this week. The client sees this on their Today screen every day, so make each one concrete and doable (what + when/how much).
- whatsapp_message: the recap Mohit pastes into the client's 1:1 WhatsApp group. Warm, direct, conversational, like Mohit texting — not a report. Use a few emojis. Use WhatsApp formatting (*bold* for the two headings). Structure: greet by first name with one line on the call; 1–2 lines acknowledging a real win or effort from the call; *What we're changing* with the changes; *Your focus this week* with the next_focus items; close with one line tying it to who they're becoming or their reason (doing_this_for) if known. Under 160 words. Sign off "— Coach Mohit".

TRANSCRIPT
${transcript}`
}

export async function writeCallNotes(transcript: string, context: CallContext): Promise<CallNotes> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in Vercel')
  if (transcript.trim().length < 200) throw new Error('The transcript is too short to write notes from.')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: prompt(transcript, context) }],
    }),
  })
  if (!res.ok) {
    console.error('Call notes Claude API error:', res.status, await res.text())
    throw new Error(
      res.status === 429 || res.status >= 500
        ? 'The notes writer is busy right now. Please try again in a minute.'
        : `The notes writer hit a setup problem (${res.status}).`
    )
  }
  const data = await res.json()
  const raw: string = (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .trim()
  try {
    return JSON.parse(raw) as CallNotes
  } catch {
    console.error('Call notes: unparseable reply', raw.slice(0, 500))
    throw new Error('The notes came back in an unexpected format. Please try again.')
  }
}
