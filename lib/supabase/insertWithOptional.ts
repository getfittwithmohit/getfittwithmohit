import type { SupabaseClient } from '@supabase/supabase-js'

// Inserts a row with new optional fields, and — if the database doesn't have
// those columns yet (migration not run) — retries with the original fields
// only. Existing answers are never lost because of a newer question.

type PgError = { code?: string; message?: string } | null

export function isMissingColumn(error: PgError): boolean {
  if (!error) return false
  if (error.code === 'PGRST204' || error.code === '42703') return true
  const m = error.message || ''
  return /column/i.test(m) && /(could not find|does not exist)/i.test(m)
}

export async function insertWithOptional<T = Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  base: Record<string, unknown>,
  optional: Record<string, unknown>,
  select?: string
): Promise<{ data: T | null; error: PgError; optionalSaved: boolean }> {
  const run = async (row: Record<string, unknown>) => {
    const q = client.from(table).insert(row)
    if (select) {
      const r = await q.select(select).single()
      return { data: r.data as T | null, error: r.error as PgError }
    }
    const r = await q
    return { data: null, error: r.error as PgError }
  }

  const hasOptional = Object.values(optional).some((v) => v !== undefined && v !== null && v !== '')
  if (!hasOptional) return { ...(await run(base)), optionalSaved: true }

  const first = await run({ ...base, ...optional })
  if (!isMissingColumn(first.error)) return { ...first, optionalSaved: !first.error }

  console.warn(`[${table}] new columns missing — saved without: ${Object.keys(optional).join(', ')}. Run supabase/onboarding_checkin_v2.sql.`)
  return { ...(await run(base)), optionalSaved: false }
}
