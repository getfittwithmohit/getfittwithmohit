import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/supabase/serverAuth'
import { generateBlueprint, isHeightPlausible } from '@/lib/utils/blueprint'
import { sumTotals, type PlateTotals } from '@/lib/utils/plate'
import { todayIST } from '@/lib/utils/istDate'
import type { PlateTargets } from '@/lib/validation/plate'

// PEAK Plate — server-only helpers shared by the /api/plate/* routes.

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export interface PlateUser {
  userId: string
  clientId: string | null // null for the coach
  isCoach: boolean
}

// Anyone signed in can use PEAK Plate — clients and the coach.
export async function requirePlateUser(): Promise<PlateUser> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Please sign in again', 401)

  const coachEmail = (process.env.COACH_EMAIL || process.env.NEXT_PUBLIC_COACH_EMAIL)?.toLowerCase()
  const isCoach = !!user.email && !!coachEmail && user.email.toLowerCase() === coachEmail

  let clientId: string | null = null
  if (!isCoach) {
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    clientId = client?.id ?? null
  }
  return { userId: user.id, clientId, isCoach }
}

export type TargetSource = 'blueprint' | 'custom' | null

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

// Clients: the Fat Loss Blueprint (same formula as the report), from height,
// gender and latest weight. If it can't be worked out, or the person is coach,
// fall back to targets they set themselves on the PEAK Plate page.
export async function getTargets(user: PlateUser): Promise<{ targets: PlateTargets | null; source: TargetSource }> {
  if (user.clientId) {
    const [{ data: client }, { data: metrics }, { data: lastCheckin }] = await Promise.all([
      supabaseAdmin.from('clients').select('gender').eq('id', user.clientId).maybeSingle(),
      supabaseAdmin.from('body_metrics').select('height_inches, weight_kg').eq('client_id', user.clientId).limit(1).maybeSingle(),
      supabaseAdmin
        .from('weekly_checkins')
        .select('weight_kg')
        .eq('client_id', user.clientId)
        .not('weight_kg', 'is', null)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    const height = num(metrics?.height_inches)
    const weight = num(lastCheckin?.weight_kg) ?? num(metrics?.weight_kg)
    if (height && weight && isHeightPlausible(height)) {
      const bp = generateBlueprint(weight, height, client?.gender ?? null)
      // Skip it when the fat-loss formula doesn't apply or lands below a safe floor
      if (!bp.notApplicable && bp.caution !== 'low') {
        return {
          source: 'blueprint',
          targets: {
            calories: bp.calories,
            protein_g: bp.proteinG,
            carbs_g: bp.carbsG,
            fat_g: bp.fatsG,
            fibre_g: bp.fiberG,
          },
        }
      }
    }
  }

  const { data: custom } = await supabaseAdmin
    .from('plate_targets')
    .select('calories, protein_g, carbs_g, fat_g, fibre_g')
    .eq('user_id', user.userId)
    .maybeSingle()
  return custom ? { targets: custom as PlateTargets, source: 'custom' } : { targets: null, source: null }
}

// Totals of meals saved to today's log, optionally leaving one out.
export async function getTodayTotals(userId: string, excludeId?: string): Promise<PlateTotals> {
  let q = supabaseAdmin
    .from('meal_logs')
    .select('calories, protein_g, carbs_g, fat_g, fibre_g')
    .eq('user_id', userId)
    .eq('meal_date', todayIST())
    .eq('logged', true)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return sumTotals(data || [])
}

// AI calls used today (every scan + every re-check), for the daily cap.
export async function getScansUsedToday(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('meal_logs')
    .select('analyses')
    .eq('user_id', userId)
    .eq('meal_date', todayIST())
  if (error) throw new Error(error.message)
  return (data || []).reduce((s, r) => s + (r.analyses || 0), 0)
}

const MODEL = process.env.PEAK_PLATE_MODEL || 'claude-sonnet-5-5'

// One Claude call. Pass a JPEG/PNG data URL to include the photo.
export async function askClaudeAboutMeal(prompt: string, imageDataUrl?: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in Vercel')

  const content: unknown[] = []
  if (imageDataUrl) {
    const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)
    if (!match) throw new PlateUserError('That photo format isn\'t supported. Please try a different photo.')
    content.push({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } })
  }
  content.push({ type: 'text', text: prompt })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content }] }),
  })
  if (!res.ok) {
    console.error('PEAK Plate Claude API error:', res.status, await res.text())
    throw new Error(`The meal scanner is busy right now (${res.status}). Please try again in a minute.`)
  }
  const data = await res.json()
  const raw: string = (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')
    .replace(/```json|```/g, '')
    .trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('The meal scanner returned something unreadable. Please try again.')
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    throw new Error('The meal scanner returned something unreadable. Please try again.')
  }
}

// An error whose message is safe and useful to show the person as-is (HTTP 422).
export class PlateUserError extends Error {}
