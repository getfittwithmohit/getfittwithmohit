// Before/after of two plan versions, for the "ask AI to change it" review.
import type { Food } from './foods'
import { describeItem, optionTotals, type PlanDoc, type PlanOption } from './plan'

export interface OptionDiff {
  kind: 'added' | 'removed' | 'changed'
  meal: string
  title: string
  before: string[]
  after: string[]
  beforeTotals?: { kcal: number; protein: number }
  afterTotals?: { kcal: number; protein: number }
}

export interface DocDiff {
  targets: { label: string; before: number; after: number }[]
  rulesAdded: string[]
  rulesRemoved: string[]
  meals: { kind: 'added' | 'removed' | 'renamed'; name: string; detail?: string }[]
  options: OptionDiff[]
  empty: boolean
}

const lines = (o: PlanOption, foods: Map<string, Food>) => [
  ...o.items.map((i) => describeItem(i, foods.get(i.food), 2)),
  ...(o.why ? [`Why: ${o.why}`] : []),
  ...(o.tip ? [`Tip: ${o.tip}`] : []),
]
const tot = (o: PlanOption, foods: Map<string, Food>) => {
  const n = optionTotals(o, foods)
  return { kcal: Math.round(n.kcal), protein: Math.round(n.protein) }
}
const same = (a: PlanOption, b: PlanOption) =>
  a.title === b.title && a.why === b.why && a.tip === b.tip && JSON.stringify(a.items) === JSON.stringify(b.items)

export function diffDocs(before: PlanDoc, after: PlanDoc, foods: Map<string, Food>): DocDiff {
  const T: [keyof PlanDoc['targets'], string][] = [['kcal', 'Calories'], ['protein_g', 'Protein g'], ['carbs_g', 'Carbs g'], ['fat_g', 'Fat g'], ['fibre_g', 'Fibre g'], ['water_l', 'Water L']]
  const targets = T.filter(([k]) => before.targets[k] !== after.targets[k]).map(([k, label]) => ({ label, before: before.targets[k], after: after.targets[k] }))
  const rulesAdded = after.rules.filter((r) => !before.rules.includes(r))
  const rulesRemoved = before.rules.filter((r) => !after.rules.includes(r))

  const meals: DocDiff['meals'] = []
  const options: OptionDiff[] = []
  const beforeMeals = new Map(before.meals.map((m) => [m.id, m]))
  const afterIds = new Set(after.meals.map((m) => m.id))
  for (const m of before.meals) if (!afterIds.has(m.id)) meals.push({ kind: 'removed', name: m.name })
  for (const m of after.meals) {
    const old = beforeMeals.get(m.id)
    if (!old) {
      meals.push({ kind: 'added', name: m.name, detail: m.time })
      for (const o of m.options) options.push({ kind: 'added', meal: m.name, title: o.title, before: [], after: lines(o, foods), afterTotals: tot(o, foods) })
      continue
    }
    if (old.name !== m.name || old.time !== m.time) meals.push({ kind: 'renamed', name: m.name, detail: `${old.name} ${old.time} → ${m.name} ${m.time}` })
    const oldOpts = new Map(old.options.map((o) => [o.id, o]))
    const newIds = new Set(m.options.map((o) => o.id))
    for (const o of old.options) if (!newIds.has(o.id)) options.push({ kind: 'removed', meal: m.name, title: o.title, before: lines(o, foods), after: [], beforeTotals: tot(o, foods) })
    for (const o of m.options) {
      const prev = oldOpts.get(o.id)
      if (!prev) options.push({ kind: 'added', meal: m.name, title: o.title, before: [], after: lines(o, foods), afterTotals: tot(o, foods) })
      else if (!same(prev, o)) {
        options.push({
          kind: 'changed', meal: m.name, title: o.title === prev.title ? o.title : `${prev.title} → ${o.title}`,
          before: lines(prev, foods), after: lines(o, foods), beforeTotals: tot(prev, foods), afterTotals: tot(o, foods),
        })
      }
    }
  }
  return { targets, rulesAdded, rulesRemoved, meals, options, empty: !targets.length && !rulesAdded.length && !rulesRemoved.length && !meals.length && !options.length }
}
