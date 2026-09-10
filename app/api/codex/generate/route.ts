import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, requireOwnClientOrCoach, authErrorResponse } from '@/lib/supabase/serverAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    await requireOwnClientOrCoach(clientId)

    // Fetch all client data in parallel
    const [
      clientRes,
      codexRes,
      pledgeRes,
      identityRes,
      psychologyRes,
      expectationsRes,
    ] = await Promise.all([
      supabaseAdmin.from('clients').select('*').eq('id', clientId).single(),
      supabaseAdmin.from('codex_data').select('*').eq('client_id', clientId).maybeSingle(),
      supabaseAdmin.from('commitment_pledges').select('*').eq('client_id', clientId).maybeSingle(),
      supabaseAdmin.from('identity_cards').select('*').eq('client_id', clientId).maybeSingle(),
      supabaseAdmin.from('psychology').select('*').eq('client_id', clientId).maybeSingle(),
      supabaseAdmin.from('expectations').select('*').eq('client_id', clientId).maybeSingle(),
    ])

    const client = clientRes.data
    const codex = codexRes.data || {}
    const pledge = pledgeRes.data || {}
    const identity = identityRes.data || {}
    const psychology = psychologyRes.data || {}
    const expectations = expectationsRes.data || {}

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const firstName = client.full_name?.split(' ')[0] || 'they'

    const prompt = `You are writing a deeply personal transformation codex for ${client.full_name}. This is not a generic document. It is a biography of their soul — their story, their values, their mission, and the life they are building.

Write in third person throughout. Use their full name "${client.full_name}" in the first paragraph of each section, then naturally alternate between "${firstName}" and third-person pronouns. Make it emotionally powerful, deeply specific to their story, and written in prose that would move someone to tears and inspire them to action simultaneously.

Write exactly 7 sections. Each section must have 3 to 4 substantial paragraphs. Total length approximately 2000 to 2500 words. Do not use bullet points or lists anywhere — only flowing, powerful prose.

HERE IS EVERYTHING ABOUT THIS PERSON:

Name: ${client.full_name}
City: ${client.city || 'not specified'}
Occupation: ${client.occupation || 'not specified'}
Gender: ${client.gender || 'not specified'}
Age context: joined the programme in ${client.phase} phase

THEIR STORY:
Where they come from: ${codex.origin_story || 'not provided'}
People who shaped them: ${codex.family_influence || 'not provided'}
Their professional and personal journey: ${codex.career_journey || 'not provided'}
The moment that changed everything: ${codex.turning_point || 'not provided'}
Most important people in their life: ${codex.key_relationships || 'not provided'}
What they want to be known for: ${codex.legacy_statement || 'not provided'}
Their relationship with their body until now: ${codex.health_story || 'not provided'}

THEIR IDENTITY:
Why they are doing this: ${pledge.why_transform || 'not provided'}
Doing this for: ${pledge.doing_this_for || 'not provided'}
The person they are becoming: ${pledge.person_becoming || 'not provided'}
What inconsistency has cost them: ${pledge.cost_of_inconsistency || 'not provided'}
Identity statement from their own words: ${identity.identity_statement || 'not provided'}
Core values: ${Array.isArray(identity.core_values) ? identity.core_values.join(', ') : (identity.core_values || 'not provided')}
Vision at 6 months: ${identity.vision_6_months || 'not provided'}
Vision at 1 year: ${identity.vision_1_year || 'not provided'}
Vision at 5 years: ${identity.vision_5_years || 'not provided'}

THEIR CODEX:
Hero or role model: ${codex.role_model || 'not provided'} — Quality they want to embody: ${codex.role_model_quality || 'not provided'}
Their peak moment when they felt most powerful: ${codex.peak_moment || 'not provided'}
Their daily battle cry: ${codex.battle_cry || 'not provided'}
Their 3 non-negotiables every day: ${codex.non_negotiables?.join(' | ') || 'not provided'}
Identity declaration in their own words: ${codex.identity_declaration || 'not provided'}
Who they are leaving behind: ${codex.person_leaving_behind || 'not provided'}
Their best day in 12 months: ${codex.best_day_description || 'not provided'}
Their deepest reason for doing this: ${codex.deepest_reason || 'not provided'}

THEIR PSYCHOLOGY:
Previous transformation attempts: ${psychology.previous_attempts || 'not provided'}
Why those attempts did not last: ${psychology.why_didnt_last || 'not provided'}
Their biggest fear: ${psychology.biggest_fear || 'not provided'}
Readiness score they gave themselves: ${psychology.readiness_score || 'not provided'} out of 10
Support system: ${Array.isArray(psychology.support_system) ? psychology.support_system.join(', ') : (psychology.support_system || 'not provided')}

THEIR GOALS:
What success looks like in 3 months: ${expectations.success_3_months || 'not provided'}
What success looks like in 12 months: ${expectations.success_12_months || 'not provided'}

Now write the 7 sections with these exact titles in all caps:

1. THE WORLD THEY CAME FROM
2. THE MAKING OF A MIND
3. THE MOMENT EVERYTHING CHANGED
4. THE PEOPLE WHO MAKE IT WORTH IT
5. THE STANDARDS THEY LIVE BY
6. THE MISSION
7. THE LIFE THEY ARE BUILDING

CRITICAL RULES:
- Every paragraph must feel written ONLY for this specific person. Use their actual words, their specific circumstances, their real details. Nothing generic.
- Make it emotionally powerful. Write to move them. This document should make them feel seen, known, and unstoppable.
- Use their real name and "${firstName}" throughout naturally.
- End the final section with a single powerful closing line in italics format using *asterisks* that uses their full name and what they are becoming.
- Write only flowing narrative prose. No lists, no bullet points, no subheadings within sections.

Return ONLY valid JSON. No other text before or after. No markdown code blocks. Just the raw JSON:
{"sections":[{"title":"THE WORLD THEY CAME FROM","content":"Full section text..."},{"title":"THE MAKING OF A MIND","content":"Full section text..."},{"title":"THE MOMENT EVERYTHING CHANGED","content":"Full section text..."},{"title":"THE PEOPLE WHO MAKE IT WORTH IT","content":"Full section text..."},{"title":"THE STANDARDS THEY LIVE BY","content":"Full section text..."},{"title":"THE MISSION","content":"Full section text..."},{"title":"THE LIFE THEY ARE BUILDING","content":"Full section text..."}]}`

    // Call Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content
      ?.filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim()

    if (!rawText) throw new Error('No content from Claude')

    // Parse JSON — strip any accidental markdown fences
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.sections?.length) throw new Error('Invalid Codex structure')

    // Store in database
    await supabaseAdmin.from('codex_data').upsert({
      client_id: clientId,
      generated_codex: parsed,
      codex_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })

    return NextResponse.json({ success: true, codex: parsed })
  } catch (err: any) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('Codex generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}