// Prompts for the PEAK Ideas writer. Two passes:
//   1. WRITER drafts more ideas than needed.
//   2. EDITOR scores every idea against the rubric, rewrites anything below 9,
//      and keeps only the best — so Coach Mohit reviews finished work, not drafts.

import { PEAK_TOPICS, PEAK_TRIGGERS, TRIGGER_LABEL } from '@/lib/constants/peakIdeas'

export const VOICE = `
You write for Coach Mohit Mehral (GetFittWithMohit), a Mumbai-based fitness transformation and peak performance coach.
- He spent 11 years in corporate IT (engineer to solution architect) before coaching, and competed in bodybuilding.
- His belief: workouts and diet plans are available everywhere; what changes people is identity (who they are becoming), habits, focus, time and purpose.
- His clients are busy Indian professionals, founders and parents: long workdays, meetings, Mumbai traffic, family duties, office snacks, chai, late dinners, travel.
- His tone: warm, direct, practical, never preachy. He talks like a coach who has lived it, not a guru.
`.trim()

export const RULES = `
WHAT A PEAK IDEA IS
One powerful idea that changes how the reader sees one thing, and one small action that proves it today.
Read in under a minute on a phone. Each idea has 3 swipe panels:
  1. hook — one line, max 14 words, that stops the scroll. A surprising truth, a reframe, or a tension. Not a question. No clichés.
  2. body — the idea, 2 or 3 short paragraphs separated by a blank line, 45 to 90 words total. First paragraph names the common belief or mistake. Then the shift. End on the line they will remember.
  3. action — ONE concrete thing to do today or tonight, max 18 words, so specific a tired person could do it in under 5 minutes. Starts with a verb.
easier_action — the same action made tiny for a low-energy day, max 14 words.
coach_take — one line, max 25 words, in Coach Mohit's voice with a real Indian everyday detail. Optional for originals (null is fine if it adds nothing).
recall_question — a question that checks they remember the core idea, max 16 words.
recall_options — exactly 3 short options (max 10 words each). One correct; two plausible but wrong. Vary which position is correct.
recall_answer — index 0, 1 or 2 of the correct option.
triggers — 0 to 2 moments this idea is the perfect thing to read, from: ${PEAK_TRIGGERS.map((t) => `${t} (${TRIGGER_LABEL[t]})`).join(', ')}. Empty array if it is a general idea.
topic — one of: ${PEAK_TOPICS.join(', ')}.

WRITING RULES
- Simple English a non-native reader understands at a glance. Short sentences. No jargon, no hashtags, no emojis.
- Specific beats general: "put your shoes by the door" beats "prepare in advance".
- Never shame. Never promise results. No medical claims, no supplements, no extreme diets, no calorie targets.
- Nothing about eating disorders, self-harm, or anything clinical.
- Each idea must stand on its own and be different from the others and from the "already written" list.
- Grounded in well-established behaviour science or coaching practice, but never cite studies or invent numbers.
- Speak to "you". Never mention AI.
`.trim()

export const RUBRIC = `
Score each idea 1 to 10 on the whole, using these tests:
- Hook: would a busy person stop scrolling? Is it fresh, not a poster cliché?
- Insight: does it change how they see something, or is it obvious advice?
- Action: is it tiny, concrete, doable today, and clearly connected to the idea?
- Clarity: understood in one read on a phone? Within word limits?
- Voice: warm, direct, practical, Indian context where natural?
- Recall: does the question test the core idea, with one clearly right answer?
A 10 is an idea a client screenshots and sends to a friend.
`.trim()

export function writerPrompt(opts: {
  mode: 'original' | 'book'
  count: number
  topic: string | null
  focus: string | null
  book: { title: string; author: string } | null
  existingHooks: string[]
}): string {
  const avoid = opts.existingHooks.length
    ? `\nALREADY WRITTEN (do not repeat these ideas or angles):\n${opts.existingHooks.map((h) => `- ${h}`).join('\n')}\n`
    : ''

  const task =
    opts.mode === 'book' && opts.book
      ? `TASK
Write ${opts.count} PEAK Ideas from the book "${opts.book.title}" by ${opts.book.author}.
- Pick the book's most useful, life-changing key ideas, in the order they appear in the book.
- Explain each idea fully in YOUR OWN words. Never copy or closely paraphrase the book's sentences. No quotes longer than 5 words.
- Only use ideas the book really makes. If you do not know this book well enough to be accurate, return {"error": "Not confident about this book"} instead.
- coach_take is REQUIRED for book ideas: how Coach Mohit would apply it to his clients' real lives.
- Choose the topic that fits each idea best.`
      : `TASK
Write ${opts.count} original PEAK Ideas${opts.topic ? ` on the topic ${opts.topic}` : ', spread across the topics'}.`

  return `${VOICE}

${RULES}

${task}
${opts.focus ? `\nCOACH'S DIRECTION FOR THIS BATCH: ${opts.focus}\n` : ''}${avoid}
Return ONLY valid JSON, no markdown:
{"ideas":[{"topic":"","hook":"","body":"","action":"","easier_action":"","coach_take":null,"recall_question":"","recall_options":["","",""],"recall_answer":0,"triggers":[]}]}`
}

export function editorPrompt(draftsJson: string, keep: number, mode: 'original' | 'book'): string {
  return `${VOICE}

You are the most demanding editor of short-form coaching content in the world. Below are draft PEAK Ideas.

${RULES}

${RUBRIC}

YOUR JOB
1. Score every draft honestly.
2. Rewrite any draft that scores below 9 until it is a 9 or 10: sharpen the hook, cut words, make the action smaller and more concrete, fix the recall question. Keep all word limits.
3. Drop drafts that are obvious, repetitive or cannot reach 9.
4. Return the best ${keep} (fewer if fewer reach 9), ${mode === 'book' ? 'kept in the book’s order' : 'best first'}.
5. Make sure the correct recall_answer position varies across the ideas.

DRAFTS
${draftsJson}

Return ONLY valid JSON, no markdown:
{"ideas":[{"topic":"","hook":"","body":"","action":"","easier_action":"","coach_take":null,"recall_question":"","recall_options":["","",""],"recall_answer":0,"triggers":[],"quality_score":9}]}`
}
