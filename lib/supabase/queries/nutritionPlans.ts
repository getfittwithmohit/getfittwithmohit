import { supabase } from '@/lib/supabase/client'
import { generateBlueprint, isHeightPlausible } from '@/lib/utils/blueprint'
import type { ClientContext, PlanDoc, PlanTargets } from '@/lib/nutrition/plan'

// Nutrition plans (supabase/nutrition_plans.sql) — coach only (RLS).

export interface NutritionPlan {
  id: string
  client_id: string | null
  name: string
  diet: string | null
  draft: PlanDoc
  published: PlanDoc | null
  version: number
  published_at: string | null
  change_note: string | null
  status: 'active' | 'archived'
  updated_at: string
}

export interface PlanVersion {
  id: string
  version: number
  doc: PlanDoc
  change_note: string | null
  published_at: string
}

const notSetUp = (e: { code?: string } | null) => e?.code === '42P01' || e?.code === 'PGRST205'
const SETUP = 'Nutrition plans aren’t set up yet. Run supabase/nutrition_plans.sql in Supabase.'

export async function getTemplates(): Promise<NutritionPlan[]> {
  const { data, error } = await supabase.from('nutrition_plans').select('*').is('client_id', null).eq('status', 'active').order('name')
  if (error) throw new Error(notSetUp(error) ? SETUP : error.message)
  return (data || []) as NutritionPlan[]
}

export async function getPlan(id: string): Promise<NutritionPlan | null> {
  const { data, error } = await supabase.from('nutrition_plans').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(notSetUp(error) ? SETUP : error.message)
  return data as NutritionPlan | null
}

export async function getClientPlan(clientId: string): Promise<NutritionPlan | null> {
  const { data, error } = await supabase.from('nutrition_plans').select('*').eq('client_id', clientId).eq('status', 'active').maybeSingle()
  if (error) throw new Error(notSetUp(error) ? SETUP : error.message)
  return data as NutritionPlan | null
}

export async function createPlan(input: { client_id: string | null; name: string; diet: string | null; draft: PlanDoc }): Promise<NutritionPlan> {
  const { data, error } = await supabase.from('nutrition_plans').insert(input).select().single()
  if (error || !data) throw new Error(notSetUp(error) ? SETUP : error?.message || 'Could not create the plan')
  return data as NutritionPlan
}

export async function saveDraft(id: string, patch: { draft?: PlanDoc; name?: string; diet?: string | null }): Promise<void> {
  const { error } = await supabase.from('nutrition_plans').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`Couldn’t save: ${error.message}`)
}

export async function publishPlan(plan: NutritionPlan, draft: PlanDoc, note: string): Promise<NutritionPlan> {
  const version = plan.version + 1
  const { error: vErr } = await supabase.from('nutrition_plan_versions').insert({
    plan_id: plan.id, version, doc: draft, change_note: note || null,
  })
  if (vErr) throw new Error(`Couldn’t publish: ${vErr.message}`)
  const { data, error } = await supabase.from('nutrition_plans').update({
    draft, published: draft, version, published_at: new Date().toISOString(), change_note: note || null, updated_at: new Date().toISOString(),
  }).eq('id', plan.id).select().single()
  if (error || !data) throw new Error(`Couldn’t publish: ${error?.message}`)
  return data as NutritionPlan
}

export async function getVersions(planId: string): Promise<PlanVersion[]> {
  const { data, error } = await supabase.from('nutrition_plan_versions').select('*').eq('plan_id', planId).order('version', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as PlanVersion[]
}

export async function archivePlan(id: string): Promise<void> {
  const { error } = await supabase.from('nutrition_plans').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

// What the plan checks need to know about the client, from onboarding.
export async function getClientContext(clientId: string): Promise<ClientContext> {
  const [n, m] = await Promise.all([
    supabase.from('nutrition').select('diet_preference, allergies, disliked_foods').eq('client_id', clientId).maybeSingle(),
    supabase.from('medical_history').select('conditions').eq('client_id', clientId).maybeSingle(),
  ])
  const conditions = (m.data?.conditions as string[] | null) || []
  return {
    diet: n.data?.diet_preference ?? null,
    allergies: n.data?.allergies ?? null,
    disliked: n.data?.disliked_foods ?? null,
    conditions: conditions.join(', ') || null,
  }
}

// Starting targets from the Fat Loss Blueprint (latest weight, height, gender).
export async function getBlueprintTargets(clientId: string): Promise<PlanTargets | null> {
  const [c, bm, wk] = await Promise.all([
    supabase.from('clients').select('gender').eq('id', clientId).maybeSingle(),
    supabase.from('body_metrics').select('height_inches, weight_kg').eq('client_id', clientId).order('recorded_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('weekly_checkins').select('weight_kg').eq('client_id', clientId).not('weight_kg', 'is', null).order('week_number', { ascending: false }).limit(1).maybeSingle(),
  ])
  const height = Number(bm.data?.height_inches)
  const weight = Number(wk.data?.weight_kg ?? bm.data?.weight_kg)
  if (!height || !weight || !isHeightPlausible(height)) return null
  const bp = generateBlueprint(weight, height, c.data?.gender ?? null)
  if (bp.notApplicable) return null
  return {
    kcal: Math.max(1200, bp.calories),
    protein_g: bp.proteinG,
    carbs_g: bp.carbsG,
    fat_g: bp.fatsG,
    fibre_g: bp.fiberG,
    water_l: 3,
  }
}
