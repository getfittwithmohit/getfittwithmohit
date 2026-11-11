import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthError, authErrorResponse, requireCoach } from '@/lib/supabase/serverAuth'
import { editorPrompt, writerPrompt } from '@/lib/ai/peakIdeasPrompt'
import { generateRequestSchema, generatedIdeaSchema, withinLimits, type GeneratedIdeaParsed } from '@/lib/validation/peakIdeas'

// Two model calls (writer + editor) can take a minute or two.
export const maxDuration = 300

const MODEL = process.env.PEAK_IDEAS_MODEL || 'claude-opus-5-5'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function askClaude(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in Vercel')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) {
    console.error('Claude API error:', res.status, await res.text())
    throw new Error(`The AI writer is unavailable right now (${res.status}). Please try again.`)
  }
  const data = await res.json()
  return (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .trim()
}

function parseJson(raw: string): { ideas?: unknown[]; error?: string } {
  const clean = raw.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('The AI writer returned something unreadable. Please try again.')
  return JSON.parse(clean.slice(start, end + 1))
}

function validIdeas(list: unknown[] | undefined): GeneratedIdeaParsed[] {
  const out: GeneratedIdeaParsed[] = []
  for (const item of list || []) {
    const parsed = generatedIdeaSchema.safeParse(item)
    if (parsed.success && withinLimits(parsed.data)) out.push(parsed.data)
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    await requireCoach()

    const parsed = generateRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }
    const { mode, count, topic = null, focus = null, book = null } = parsed.data

    // Show the writer what already exists so it never repeats itself
    let existingQuery = supabaseAdmin.from('peak_ideas').select('hook, book_order').neq('status', 'archived')
    existingQuery =
      mode === 'book' && book
        ? existingQuery.eq('kind', 'book').ilike('book_title', book.title)
        : existingQuery.order('created_at', { ascending: false }).limit(150)
    const { data: existing, error: existingError } = await existingQuery
    if (existingError) throw new Error(existingError.message)
    const existingHooks = (existing || []).map((e) => e.hook as string)
    const nextBookOrder = Math.max(0, ...(existing || []).map((e) => (e.book_order as number) || 0)) + 1

    // Pass 1 — writer drafts ~50% more than needed
    const draftCount = Math.min(15, Math.ceil(count * 1.5))
    const drafts = parseJson(
      await askClaude(writerPrompt({ mode, count: draftCount, topic, focus, book, existingHooks }), 8000)
    )
    if (drafts.error) return NextResponse.json({ error: drafts.error }, { status: 422 })
    const draftIdeas = validIdeas(drafts.ideas)
    if (!draftIdeas.length) throw new Error('The AI writer returned no usable ideas. Please try again.')

    // Pass 2 — editor scores, rewrites below-9s, keeps the best
    const edited = parseJson(await askClaude(editorPrompt(JSON.stringify(draftIdeas, null, 1), count, mode), 8000))
    const finalIdeas = validIdeas(edited.ideas).slice(0, count)
    if (!finalIdeas.length) throw new Error('No idea passed the quality check. Try again with a clearer direction.')

    const rows = finalIdeas.map((idea, i) => ({
      ...idea,
      kind: mode,
      book_title: mode === 'book' ? book!.title : null,
      book_author: mode === 'book' ? book!.author : null,
      book_order: mode === 'book' ? nextBookOrder + i : null,
      status: 'draft',
    }))
    const { data: saved, error } = await supabaseAdmin.from('peak_ideas').insert(rows).select('id')
    if (error) throw new Error(error.message)

    return NextResponse.json({ created: saved?.length || 0 })
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err)
    console.error('PEAK Ideas generate error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 500 })
  }
}
