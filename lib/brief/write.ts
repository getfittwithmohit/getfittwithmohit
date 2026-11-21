import type { BriefFacts } from './facts'

// Coach Brief — the words. Claude turns the computed facts into a one-page
// pre-call brief in Coach Mohit's style. It may only use the facts given.

export interface CoachBrief {
  status: 'on_track' | 'watch' | 'at_risk'
  headline: string
  changes: string[]
  red_flags: { flag: string; why_it_matters: string }[]
  wins: string[]
  talking_points: string[]
  plan_tweaks: string[]
  data_gaps: string[]
}

const STR = { type: 'string' }
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const list = (items: unknown) => ({ type: 'array', items })

const SCHEMA = obj({
  status: { type: 'string', enum: ['on_track', 'watch', 'at_risk'] },
  headline: STR,
  changes: list(STR),
  red_flags: list(obj({ flag: STR, why_it_matters: STR })),
  wins: list(STR),
  talking_points: list(STR),
  plan_tweaks: list(STR),
  data_gaps: list(STR),
})

const MODEL = process.env.COACH_BRIEF_MODEL || process.env.PEAK_PLATE_MODEL || 'claude-sonnet-5-5'

function prompt(f: BriefFacts) {
  return `You are the analyst behind Coach Mohit, a 1:1 transformation and peak-performance coach in India. Before each weekly call he reads a one-page brief on the client. Write that brief.

His philosophy: workouts and diets are available everywhere; what he coaches is identity (who the client is becoming), habits, focus, time management and purpose. Talking points should sound like him: direct, warm, about the person and their why — not generic fitness advice.

RULES
- Use ONLY the facts in the JSON below. Never invent or estimate a number, event, food, feeling or reason. If something isn't in the facts, it didn't happen.
- Quote numbers exactly as given (kg, inches, averages, counts). Negative weight/inch changes are losses (good for fat loss).
- Compare "daily_this_7_days" with "daily_previous_7_days" to find what changed.
- Be specific and short. Each line ≤ 25 words. No emojis. No medical diagnosis — for pain flags or health issues, suggest checking in, not treatment.
- Use the client's first name.

OUTPUT (JSON)
- status: on_track (moving well), watch (slipping in 1–2 areas), at_risk (several areas down, missing check-ins, or asked for help).
- headline: one sentence that captures the week.
- changes: 3–5 lines of what moved, each with its number (e.g. "Weight 71.6 → 71.2 kg (−0.4)").
- red_flags: 0–4 items, most important first; each with why it matters for this client.
- wins: 1–3 things to celebrate (habits and identity count, not just the scale). Empty only if there truly are none.
- talking_points: exactly 3 things Mohit can say or ask on the call, tied to their why where possible.
- plan_tweaks: 0–3 concrete, small adjustments (e.g. "Move workouts to 7 am on meeting days").
- data_gaps: what's missing that Mohit should ask about (use data_gaps from the facts, plus anything else obvious).

FACTS
${JSON.stringify(f, null, 1)}`
}

export async function writeBrief(facts: BriefFacts): Promise<CoachBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in Vercel')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: prompt(facts) }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Coach Brief Claude API error:', res.status, body)
    throw new Error(
      res.status === 429 || res.status >= 500
        ? 'The brief writer is busy right now. Please try again in a minute.'
        : `The brief writer hit a setup problem (${res.status}).`
    )
  }
  const data = await res.json()
  const raw: string = (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .trim()
  try {
    return JSON.parse(raw) as CoachBrief
  } catch {
    console.error('Coach Brief: unparseable reply', raw.slice(0, 500))
    throw new Error('The brief came back in an unexpected format. Please try again.')
  }
}
