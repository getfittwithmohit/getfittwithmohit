// Server-only. The AI nutritionist: drafts a plan from what a client already
// eats, and edits a plan from a plain-language instruction. It may only use
// foods from the GFM food library (enforced by the output schema), so every
// number in a plan still comes from the library, never from the model.

import { createClient } from '@supabase/supabase-js'
import { generateBlueprint, isHeightPlausible } from '@/lib/utils/blueprint'
import { defaultMeasure, nutrientsFor, type Food } from './foods'
import { dayTotals, newId, optionTotals, type Level, type PlanDoc, type PlanItem, type PlanTargets } from './plan'

export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODEL = process.env.NUTRITION_MODEL || process.env.PEAK_PLATE_MODEL || 'claude-sonnet-5-5'
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))

// ── Context ──────────────────────────────────────────────────────────────────

export interface ClientFacts {
  first_name: string
  gender: string | null
  diet: string | null
  allergies: string | null
  disliked: string | null
  meals_per_day: string | null
  eating_out: string | null
  digestion: string | null
  day_in_life: string | null
  conditions: string | null
  goal: string | null
  latest_call: { week: number; discussed: string | null; changes: string | null; next_focus: string | null } | null
}

export async function loadFoods(): Promise<Food[]> {
  const { data, error } = await admin.from('foods').select('*')
  if (error) throw new Error('The food library isn’t set up. Run supabase/nutrition_foods.sql.')
  return (data || []).map((r) => ({
    ...r, kcal: num(r.kcal), protein_g: num(r.protein_g), carbs_g: num(r.carbs_g), fat_g: num(r.fat_g), fibre_g: num(r.fibre_g),
    measures: (r.measures || []).map((m: { label: string; grams: unknown; default?: boolean }) => ({ ...m, grams: num(m.grams) })),
  })) as Food[]
}

export async function loadClientFacts(clientId: string): Promise<{ facts: ClientFacts; targets: PlanTargets | null }> {
  const one = async <T,>(p: PromiseLike<{ data: T | null }>) => { try { return (await p).data } catch { return null } }
  const [client, nutrition, lifestyle, medical, metrics, weekly, call] = await Promise.all([
    one(admin.from('clients').select('full_name, gender').eq('id', clientId).maybeSingle()),
    one(admin.from('nutrition').select('*').eq('client_id', clientId).maybeSingle()),
    one(admin.from('lifestyle').select('day_in_life').eq('client_id', clientId).maybeSingle()),
    one(admin.from('medical_history').select('conditions').eq('client_id', clientId).maybeSingle()),
    one(admin.from('body_metrics').select('height_inches, weight_kg, primary_goal').eq('client_id', clientId).order('recorded_at', { ascending: true }).limit(1).maybeSingle()),
    one(admin.from('weekly_checkins').select('weight_kg').eq('client_id', clientId).not('weight_kg', 'is', null).order('week_number', { ascending: false }).limit(1).maybeSingle()),
    one(admin.from('review_calls').select('week_number, discussed, changes, next_focus').eq('client_id', clientId).eq('status', 'completed').order('week_number', { ascending: false }).limit(1).maybeSingle()),
  ])
  const c = client as { full_name?: string; gender?: string } | null
  const n = nutrition as Record<string, unknown> | null
  const m = metrics as { height_inches?: number; weight_kg?: number; primary_goal?: string } | null
  const cl = call as { week_number: number; discussed: string | null; changes: string | null; next_focus: string | null } | null

  let targets: PlanTargets | null = null
  const height = num(m?.height_inches)
  const weight = num((weekly as { weight_kg?: number } | null)?.weight_kg ?? m?.weight_kg)
  if (height && weight && isHeightPlausible(height)) {
    const bp = generateBlueprint(weight, height, c?.gender ?? null)
    if (!bp.notApplicable) {
      targets = { kcal: Math.max(1200, bp.calories), protein_g: bp.proteinG, carbs_g: bp.carbsG, fat_g: bp.fatsG, fibre_g: bp.fiberG, water_l: 3 }
    }
  }
  return {
    targets,
    facts: {
      first_name: (c?.full_name || 'the client').split(' ')[0],
      gender: c?.gender ?? null,
      diet: (n?.diet_preference as string) ?? null,
      allergies: (n?.allergies as string) ?? null,
      disliked: (n?.disliked_foods as string) ?? null,
      meals_per_day: (n?.meals_per_day as string) ?? null,
      eating_out: (n?.eating_out_frequency as string) ?? null,
      digestion: ((n?.digestion_issues as string[]) || []).join(', ') || null,
      day_in_life: (lifestyle as { day_in_life?: string } | null)?.day_in_life ?? null,
      conditions: (((medical as { conditions?: string[] } | null)?.conditions) || []).join(', ') || null,
      goal: m?.primary_goal ?? null,
      latest_call: cl ? { week: cl.week_number, discussed: cl.discussed, changes: cl.changes, next_focus: cl.next_focus } : null,
    },
  }
}

// Foods the AI may add: active, and right for the client's diet.
export function allowedFoods(all: Food[], diet: string | null): Food[] {
  const foods = all.filter((f) => f.is_active)
  const d = (diet || '').toLowerCase()
  if (d.includes('vegan')) return foods.filter((f) => f.is_vegan)
  if (d.includes('jain')) return foods.filter((f) => f.is_jain_ok)
  if (d.includes('egg')) return foods.filter((f) => f.diet !== 'nonveg')
  if (d.includes('non')) return foods
  if (d.includes('veg')) return foods.filter((f) => f.diet === 'veg')
  return foods
}

// One line per food: slug | name (local) | measures with kcal/protein each.
function catalog(foods: Food[]): string {
  return foods
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    .map((f) => {
      const ms = f.measures.map((m) => {
        const n = nutrientsFor(f, m.grams)
        return `"${m.label}"=${Math.round(n.kcal)}kcal/${Math.round(n.protein * 10) / 10}gP`
      }).join('; ')
      return `${f.slug} | ${f.name}${f.local_name ? ` (${f.local_name})` : ''} | ${f.category} | ${ms}`
    })
    .join('\n')
}

// ── Claude ───────────────────────────────────────────────────────────────────

// The food list is enforced through an enum in the schema. If the API refuses a
// schema that large, retry once with the enum removed (fixItems still drops any
// food that isn't in the library).
const stripEnums = (s: unknown): unknown =>
  Array.isArray(s) ? s.map(stripEnums)
    : s && typeof s === 'object'
      ? Object.fromEntries(Object.entries(s as Record<string, unknown>).filter(([k]) => k !== 'enum').map(([k, v]) => [k, stripEnums(v)]))
      : s

export interface MealImage {
  data: string // base64, no data: prefix
  media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  caption?: string
}

type Content = string | ({ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } })[]

async function callClaude<T>(prompt: Content, schema: object, maxTokens = 12000): Promise<T> {
  try {
    return await callClaudeOnce<T>(prompt, schema, maxTokens)
  } catch (e) {
    if ((e as Error & { status?: number }).status === 400) return callClaudeOnce<T>(prompt, stripEnums(schema) as object, maxTokens)
    throw e
  }
}

async function callClaudeOnce<T>(prompt: Content, schema: object, maxTokens: number): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in Vercel')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    console.error('Nutrition AI error:', res.status, await res.text())
    const err = new Error(res.status === 429 || res.status >= 500
      ? 'The plan writer is busy right now. Please try again in a minute.'
      : `The plan writer hit a setup problem (${res.status}).`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  const data = await res.json()
  const raw: string = (data.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim()
  try {
    return JSON.parse(raw) as T
  } catch {
    console.error('Nutrition AI: unparseable reply', raw.slice(0, 500))
    throw new Error('The plan came back in an unexpected format. Please try again.')
  }
}

const STR = { type: 'string' }
const NUM = { type: 'number' }
const arr = (items: object) => ({ type: 'array', items })
const obj = (properties: Record<string, object>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false })

const itemSchema = (slugs: string[]) => obj({ food: { type: 'string', enum: slugs }, qty: NUM, measure: STR })
const planSchema = (slugs: string[]) => obj({
  targets: obj({ kcal: NUM, protein_g: NUM, carbs_g: NUM, fat_g: NUM, fibre_g: NUM, water_l: NUM }),
  rules: arr(STR),
  meals: arr(obj({
    id: STR, name: STR, time: STR,
    options: arr(obj({ id: STR, title: STR, why: STR, tip: STR, items: arr(itemSchema(slugs)) })),
  })),
})

const VOICE = `You are Coach Mohit Mehral's nutrition system — the standard of the world's best nutrition coaches, applied to Indian home food. Mohit is an ISSA-certified nutritionist and transformation coach in Mumbai. His philosophy: workouts and diets are available everywhere; what changes people is identity, habits and a plan they can live with. Adherence beats precision.

WRITING RULES (everything the client reads — titles, "why", tips, rules):
- Written as Mohit, to the client by first name or "you". Never mention AI, models, systems or apps.
- Plain, warm, direct English. Indian kitchen words are good (katori, roti, sabzi, tiffin, tadka). Short sentences.
- Every "why" is specific to THIS client — their day, their old habit, their goal, a number — never generic praise. Max 22 words.
- Tips are practical prep or ordering tips, max 16 words, or "".
- No medical diagnosis or treatment. No supplements beyond what the client already takes or whey if they already use it. No brand names.

FOOD RULES:
- Use ONLY foods from the CATALOG, by slug. "measure" must be one of that food's measure labels exactly as written. "qty" = how many of that measure (½ = 0.5). For the "100 g" measure, qty 1.5 means 150 g.
- Never use a food the client is allergic to or dislikes. Respect the diet type.`

// ── Draft from what the client eats ─────────────────────────────────────────

export interface DraftResult {
  current: { meals: { name: string; time: string; items: PlanItem[]; note: string }[]; unmapped: string[] }
  gaps: string[]
  changes: { what: string; why: string }[]
  missing_foods: { name: string; why: string }[]
  plan: PlanDoc
}

export async function draftFromIntake(args: {
  foods: Food[]; facts: ClientFacts; targets: PlanTargets; level: Level
  mealLog: string; transcript: string; notes: string; images?: MealImage[]
}): Promise<DraftResult> {
  const allow = allowedFoods(args.foods, args.facts.diet)
  const slugs = allow.map((f) => f.slug)
  const schema = obj({
    current: obj({
      meals: arr(obj({ name: STR, time: STR, items: arr(itemSchema(slugs)), note: STR })),
      unmapped: arr(STR),
    }),
    gaps: arr(STR),
    changes: arr(obj({ what: STR, why: STR })),
    missing_foods: arr(obj({ name: STR, why: STR })),
    plan: planSchema(slugs),
  })

  const prompt = `${VOICE}

TASK: Build ${args.facts.first_name}'s personal nutrition plan FROM WHAT THEY ALREADY EAT.

Method (follow it exactly):
1. CURRENT: Read the food log${args.images?.length ? ' and the photos' : ''}. Map what they eat on a typical day into meals with times, using catalog foods and realistic portions. Anything you cannot map goes in "unmapped" (their words). Add a short note per meal (e.g. "only 6 g protein", "fried, 2 tsp oil").
2. GAPS: the 2–4 biggest problems versus the targets (protein, portions, oil/sugar, timing, fibre, late dinners…), each one line with numbers.
3. PLAN: keep the shape of their day — same meal times and number of meals, same kinds of food and the same dishes wherever possible. Change only what moves results (roughly: keep 80%, fix 20%):
   - lift protein in every meal (add or upgrade: curd, dal, paneer, sprouts, eggs/chicken/fish if their diet allows, whey only if they already use it);
   - right-size portions of roti, rice, oil, ghee, sugar;
   - swap the problem items for close, familiar alternatives.
   For each meal give 2–3 options built from THEIR OWN repeats (if they alternate poha and upma, both become options, each fixed). Option 1 is the most typical.
   Option 1 of every meal, added up, should land within about 5% of the calorie target and reach the protein target. Other options should be within about 10% of option 1's calories.
   ids: use short ids like "m1", "m1o1".
   rules: 3–5 rules written for this client's specific habits (not generic).
   targets: return the targets given below unchanged unless the coach's notes say otherwise.
4. CHANGES: up to 6 of the most important changes, old → new, each with a one-line why. These are shown to the coach, not the client.
5. MISSING_FOODS: foods they eat that are not in the catalog and that matter (so the coach can add them). Up to 5. Empty if none.

LEVEL: ${args.level} (1 = habits, 2 = household portions, 3 = grams). Portions are always given as measures; the app shows them at the right level.

TARGETS: ${JSON.stringify(args.targets)}

CLIENT (from onboarding):
${JSON.stringify(args.facts, null, 1)}

FOOD LOG (as the client sent it — may be messy, Hinglish or WhatsApp style):
"""
${args.mealLog.trim() ? args.mealLog.slice(0, 20000) : '(none typed — use the photos)'}
"""
${args.images?.length ? `
PHOTOS: ${args.images.length} photo(s) are attached above, in order — meal photos and/or WhatsApp screenshots from the client, with the coach's caption where given:
${args.images.map((im, i) => `Photo ${i + 1}: ${im.caption?.trim() || '(no caption)'}`).join('\n')}
How to read them:
- Identify every food on the plate and estimate portions from what you see: roti count, katori size (a standard katori is ~150 g), rice mound, glass size, pieces. Note visible oil, ghee, fried items and sweets.
- Times and days: use the caption, or the timestamps/text visible in a WhatsApp screenshot. If unknown, infer the meal from the food and order.
- The same meal photographed on different days shows what repeats — use that for the options.
- If a photo is unclear, make your best estimate and say so in that meal's note.
` : ''}
${args.transcript.trim() ? `\nCALL TRANSCRIPT OR NOTES (from the coach — use anything about food, schedule, preferences, problems):\n"""\n${args.transcript.slice(0, 40000)}\n"""\n` : ''}${args.notes.trim() ? `\nCOACH'S INSTRUCTIONS (follow these; they override the method above if they conflict):\n"""\n${args.notes.slice(0, 4000)}\n"""\n` : ''}
CATALOG (slug | name (local name) | category | measures with kcal and protein per measure):
${catalog(allow)}`

  const content: Content = args.images?.length
    ? [
        ...args.images.flatMap((im, i) => [
          { type: 'text' as const, text: `Photo ${i + 1}${im.caption?.trim() ? ` — ${im.caption.trim()}` : ''}:` },
          { type: 'image' as const, source: { type: 'base64' as const, media_type: im.media_type, data: im.data } },
        ]),
        { type: 'text' as const, text: prompt },
      ]
    : prompt
  const out = await callClaude<Omit<DraftResult, 'plan'> & { plan: Omit<PlanDoc, 'level'> }>(content, schema)
  const bySlug = new Map(args.foods.map((f) => [f.slug, f]))
  return {
    current: { meals: out.current.meals.map((m) => ({ ...m, items: fixItems(m.items, bySlug) })), unmapped: out.current.unmapped },
    gaps: out.gaps,
    changes: out.changes,
    missing_foods: out.missing_foods,
    plan: normaliseDoc({ ...out.plan, level: args.level }, bySlug),
  }
}

// ── Edit by instruction ─────────────────────────────────────────────────────

export interface EditResult {
  plan: PlanDoc
  summary: string[]
}

export async function editPlan(args: {
  foods: Food[]; facts: ClientFacts | null; doc: PlanDoc; instruction: string; transcript: string; diet: string | null
}): Promise<EditResult> {
  const allow = allowedFoods(args.foods, args.facts?.diet ?? args.diet)
  const slugs = allow.map((f) => f.slug)
  const bySlug = new Map(args.foods.map((f) => [f.slug, f]))
  // Never let a food already in the plan be rejected by the schema
  for (const m of args.doc.meals) for (const o of m.options) for (const i of o.items) if (!slugs.includes(i.food) && bySlug.has(i.food)) slugs.push(i.food)
  const schema = obj({ plan: planSchema(slugs), summary: arr(STR) })
  const day = dayTotals(args.doc, bySlug).typical

  const prompt = `${VOICE}

TASK: Change ${args.facts?.first_name || 'this'}'s nutrition plan exactly as the coach asks — and nothing else.

Rules for editing:
- Return the WHOLE plan. Everything the instruction does not touch stays exactly the same: same ids, titles, items, quantities, measures, "why" and tip text, same order.
- Keep existing ids for meals and options you keep or change. New meals/options get new short ids (e.g. "n1").
- When you change an option, update its "why" (and tip if needed) so it still matches.
- If the instruction is about calories or protein, adjust portions and foods so a typical day (option 1 of each meal) hits it.
- summary: 1–6 short lines saying what you changed, for the coach (e.g. "Dinner: 3 roti → 2, added a katori of curd").

COACH'S INSTRUCTION:
"""
${args.instruction.slice(0, 4000)}
"""
${args.transcript.trim() ? `\nCALL TRANSCRIPT OR NOTES TO USE:\n"""\n${args.transcript.slice(0, 40000)}\n"""\n` : ''}
${args.facts ? `CLIENT:\n${JSON.stringify(args.facts, null, 1)}\n` : 'This is a TEMPLATE, not a client plan.\n'}
TYPICAL DAY NOW: ${Math.round(day.kcal)} kcal, ${Math.round(day.protein)} g protein.

CURRENT PLAN (JSON):
${JSON.stringify({ targets: args.doc.targets, rules: args.doc.rules, meals: args.doc.meals })}

CATALOG (slug | name (local name) | category | measures with kcal and protein per measure):
${catalog(allow)}`

  const out = await callClaude<{ plan: Omit<PlanDoc, 'level'>; summary: string[] }>(prompt, schema)
  return { plan: normaliseDoc({ ...out.plan, level: args.doc.level }, bySlug), summary: out.summary }
}

// ── Clean-up of what the model returns ──────────────────────────────────────

function fixItems(items: PlanItem[], bySlug: Map<string, Food>): PlanItem[] {
  return items
    .filter((i) => bySlug.has(i.food) && i.qty > 0)
    .map((i) => {
      const f = bySlug.get(i.food)!
      const m = f.measures.find((x) => x.label === i.measure) ||
        f.measures.find((x) => x.label.toLowerCase().startsWith(i.measure.toLowerCase().replace(/\s*\(.*$/, ''))) ||
        defaultMeasure(f)
      return { food: i.food, qty: Math.round(i.qty * 100) / 100, measure: m.label, grams: m.grams }
    })
}

export function normaliseDoc(doc: PlanDoc, bySlug: Map<string, Food>): PlanDoc {
  const seen = new Set<string>()
  const uid = (id: string) => {
    const v = id && !seen.has(id) ? id : newId()
    seen.add(v)
    return v
  }
  return {
    level: doc.level,
    targets: {
      kcal: Math.round(num(doc.targets?.kcal)), protein_g: Math.round(num(doc.targets?.protein_g)),
      carbs_g: Math.round(num(doc.targets?.carbs_g)), fat_g: Math.round(num(doc.targets?.fat_g)),
      fibre_g: Math.round(num(doc.targets?.fibre_g)), water_l: num(doc.targets?.water_l) || 3,
    },
    rules: (doc.rules || []).map((r) => r.trim()).filter(Boolean).slice(0, 8),
    meals: (doc.meals || []).map((m) => ({
      id: uid(m.id), name: m.name || 'Meal', time: m.time || '',
      options: (m.options || []).slice(0, 4).map((o) => ({
        id: uid(o.id), title: o.title || '', why: o.why || '', tip: o.tip || '', items: fixItems(o.items || [], bySlug),
      })).filter((o) => o.items.length > 0),
    })).filter((m) => m.options.length > 0),
  }
}

export function currentTotals(meals: DraftResult['current']['meals'], bySlug: Map<string, Food>) {
  return meals.reduce((t, m) => {
    const n = optionTotals({ id: '', title: '', why: '', tip: '', items: m.items }, bySlug)
    return { kcal: t.kcal + n.kcal, protein: t.protein + n.protein, carbs: t.carbs + n.carbs, fat: t.fat + n.fat, fibre: t.fibre + n.fibre }
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
}
