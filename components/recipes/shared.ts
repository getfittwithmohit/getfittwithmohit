import type { Food } from '@/lib/nutrition/foods'
import { fitsDiet, mainProtein, type Recipe } from '@/lib/nutrition/recipes'

// Soft card colours per main protein (recipe hero and book tiles).
export const PROTEIN_TINT: Record<string, string> = {
  paneer: '#FDF1E3', egg: '#FEF7DC', chicken: '#FBEAE6', fish: '#E6F0FB',
  dal: '#FBF3DC', soya: '#F1EFE8', tofu: '#F3F4E8', curd: '#EEF2FF',
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))

export function normaliseFoods(rows: Record<string, unknown>[]): Food[] {
  return (rows || []).map((r) => ({
    ...(r as unknown as Food),
    kcal: num(r.kcal), protein_g: num(r.protein_g), carbs_g: num(r.carbs_g), fat_g: num(r.fat_g), fibre_g: num(r.fibre_g),
    measures: ((r.measures as Food['measures']) || []).map((m) => ({ ...m, grams: num(m.grams) })),
  }))
}

// "Chicken breast, skinless (raw)" → "Chicken breast"
export function shortName(f: Pick<Food, 'name'>): string {
  return f.name.split(',')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim()
}

// Can this client cook it? Everything except the protein must fit their diet,
// and at least one protein option (the recipe's own or a swap) must too.
export function recipeFits(r: Recipe, bySlug: Map<string, Food>, diet: string | null): boolean {
  const main = mainProtein(r)
  const rest = r.ingredients.filter((i) => !i.is_protein)
  if (!rest.every((i) => { const f = bySlug.get(i.food); return !f || fitsDiet(f, diet) })) return false
  return [main?.food, ...r.swaps.map((s) => s.food)].some((s) => { const f = s ? bySlug.get(s) : undefined; return !!f && fitsDiet(f, diet) })
}

// Swap one ingredient's name for another in recipe text, keeping the case of
// the first letter ("Crumble in the paneer" → "Crumble in the tofu").
export function swapWords(text: string, from: string | undefined, to: string | undefined): string {
  if (!from || !to || from === to) return text
  const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return text.replace(re, (m) => (m[0] === m[0].toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to.toLowerCase()))
}
