import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const [clientRes, pledgeRes, identityRes, codexRes] = await Promise.all([
      supabaseAdmin
        .from('clients')
        .select('full_name, occupation, city')
        .eq('id', clientId)
        .single(),
      supabaseAdmin
        .from('commitment_pledges')
        .select('why_transform, doing_this_for, person_becoming')
        .eq('client_id', clientId)
        .maybeSingle(),
      supabaseAdmin
        .from('identity_cards')
        .select('identity_statement, core_values, vision_1_year')
        .eq('client_id', clientId)
        .maybeSingle(),
      supabaseAdmin
        .from('codex_data')
        .select('battle_cry, identity_declaration, non_negotiables, deepest_reason')
        .eq('client_id', clientId)
        .maybeSingle(),
    ])

    const client = clientRes.data
    const pledge = (pledgeRes.data || {}) as any
    const identity = (identityRes.data || {}) as any
    const codex = (codexRes.data || {}) as any

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const firstName = client.full_name?.split(' ')[0] || 'I'

    const coreValues = Array.isArray(identity.core_values)
      ? identity.core_values.join(', ')
      : identity.core_values || ''

    const nonNeg = Array.isArray(codex.non_negotiables)
      ? codex.non_negotiables.join(', ')
      : ''

    const prompt = `Generate deeply personal affirmations for ${firstName}. These will be recorded in their own voice and listened to every morning as part of a daily transformation ritual.

About this person:
- Name: ${client.full_name}
- Occupation: ${client.occupation || 'professional'}
- Why they are doing this: ${pledge.why_transform || 'to transform their life'}
- Doing this for: ${pledge.doing_this_for || 'themselves and the people they love'}
- Person they are becoming: ${pledge.person_becoming || 'their highest self'}
- Identity statement: ${identity.identity_statement || ''}
- Core values: ${coreValues}
- 1 year vision: ${identity.vision_1_year || ''}
- Battle cry: ${codex.battle_cry || ''}
- Identity declaration: ${codex.identity_declaration || ''}
- Non-negotiables: ${nonNeg}
- Deepest reason: ${codex.deepest_reason || ''}

Write affirmations in FIRST PERSON ("I am...", "I have...", "I create...", "I build..."). Always present tense. Emotionally powerful and specific to this person — not generic. Use their actual details from above.

Write exactly 2 affirmations for each of these 9 categories:

1. Health — physical strength, energy, body
2. Mindset — thoughts, beliefs, mental power
3. Purpose — mission, calling, meaning
4. Legacy — impact, what they leave behind
5. Learning — growth, curiosity, wisdom
6. Creativity — expression, innovation, ideas
7. Values — integrity, principles, character
8. Wealth — abundance, financial power, prosperity
9. Skills — mastery, excellence, capability

CRITICAL RULES:
- First person always: "I am...", "I have...", "I create..."
- Present tense always — as if already true
- Specific to this person — use their actual details
- Emotionally charged — should give them goosebumps
- No generic affirmations — every single one must feel written only for ${firstName}

Return ONLY valid JSON with no other text, no markdown, no code blocks:
{"categories":[{"name":"Health","affirmations":["affirmation 1","affirmation 2"]},{"name":"Mindset","affirmations":["affirmation 1","affirmation 2"]},{"name":"Purpose","affirmations":["affirmation 1","affirmation 2"]},{"name":"Legacy","affirmations":["affirmation 1","affirmation 2"]},{"name":"Learning","affirmations":["affirmation 1","affirmation 2"]},{"name":"Creativity","affirmations":["affirmation 1","affirmation 2"]},{"name":"Values","affirmations":["affirmation 1","affirmation 2"]},{"name":"Wealth","affirmations":["affirmation 1","affirmation 2"]},{"name":"Skills","affirmations":["affirmation 1","affirmation 2"]}]}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude API error:', err)
      return NextResponse.json({ error: 'Claude API failed' }, { status: 500 })
    }

    const claudeData = await claudeRes.json()

    const rawText = claudeData.content
      ?.filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'No content returned from Claude' }, { status: 500 })
    }

    const clean = rawText.replace(/```json|```/g, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw:', clean.slice(0, 200))
      return NextResponse.json({ error: 'Failed to parse affirmations' }, { status: 500 })
    }

    if (!parsed.categories?.length) {
      return NextResponse.json({ error: 'Invalid affirmations structure' }, { status: 500 })
    }

    const fullText = parsed.categories
      .map((cat: any) => `${cat.name.toUpperCase()}\n${cat.affirmations.join('\n')}`)
      .join('\n\n')

    await supabaseAdmin
      .from('affirmations')
      .upsert(
        {
          client_id: clientId,
          generated_text: fullText,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'client_id' }
      )

    return NextResponse.json({
      success: true,
      text: fullText,
      categories: parsed.categories,
    })

  } catch (err: any) {
    console.error('Affirmations generate error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}