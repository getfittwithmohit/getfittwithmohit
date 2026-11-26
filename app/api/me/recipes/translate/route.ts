import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { admin, loadFoods } from '@/lib/nutrition/ai'
import { translateRecipe } from '@/lib/nutrition/recipeAi'
import type { Recipe, RecipeTranslation } from '@/lib/nutrition/recipes'

// Hindi / Marathi version of an approved recipe for "Send to whoever's
// cooking". Made once per recipe version and saved, so it's instant after.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { id, lang } = await req.json()
    if (lang !== 'hi' && lang !== 'mr') return NextResponse.json({ error: 'Unknown language' }, { status: 400 })
    const { data: row } = await admin.from('recipes').select('*').eq('id', String(id)).eq('status', 'approved').maybeSingle()
    if (!row) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

    const at = String(row.updated_at)
    const cached = (row.translations || {})[lang] as RecipeTranslation | undefined
    if (cached && cached.at === at) return NextResponse.json({ translation: cached })

    const foods = await loadFoods()
    const t: RecipeTranslation = { at, ...(await translateRecipe({ recipe: row as Recipe, foods, lang })) }
    // Save without touching updated_at, so the cache stays valid
    await admin.from('recipes').update({ translations: { ...(row.translations || {}), [lang]: t } }).eq('id', row.id)
    return NextResponse.json({ translation: t })
  } catch (err) {
    console.error('recipe translate error', err)
    return NextResponse.json({ error: 'Couldn’t translate right now. Send it in English, or try again in a minute.' }, { status: 500 })
  }
}
