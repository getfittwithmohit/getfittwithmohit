// Builds supabase/nutrition_foods.sql from catalog.mjs + the IFCT 2017 table.
//
//   npm i --no-save @ifct2017/compositions    (once, anywhere)
//   node scripts/nutrition/build-seed.mjs <path to @ifct2017/compositions/index.csv>
//
// Energy is computed from the macros for every food (4 kcal/g protein and
// carbs, 9 fat, 2 fibre) so all numbers are consistent; the IFCT energy column
// is not used (it is missing for oils and inconsistent for a few foods).

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENTS, DISHES } from './catalog.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node build-seed.mjs <path to IFCT index.csv>')
  process.exit(1)
}

// ── IFCT csv ──
function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const [header, ...body] = parseCsv(fs.readFileSync(csvPath, 'utf8'))
const col = (key) => header.findIndex((h) => h.endsWith(`; ${key}`))
const C = { code: col('code'), name: col('name'), p: col('protcnt'), c: col('choavldf'), f: col('fatce'), fib: col('fibtg') }
const ifct = new Map(body.filter((r) => r.length > 5).map((r) => [r[C.code], {
  name: r[C.name], p: +r[C.p] || 0, c: +r[C.c] || 0, f: +r[C.f] || 0, fib: +r[C.fib] || 0,
}]))

const r1 = (n) => Math.round(n * 10) / 10
const kcal = (v) => 4 * v.p + 4 * v.c + 9 * v.f + 2 * v.fib

// ── Ingredients ──
const foods = new Map()
for (const [slug, name, local, category, src, tags, allergens, measures, sourceOverride, note] of INGREDIENTS) {
  if (foods.has(slug)) throw new Error(`Duplicate slug ${slug}`)
  let v, source, ref
  if (typeof src === 'string') {
    const row = ifct.get(src)
    if (!row) throw new Error(`IFCT code ${src} not found (${slug})`)
    v = row; source = 'ifct2017'; ref = `${src} · ${row.name}`
  } else {
    v = src; source = sourceOverride || 'label'; ref = null
  }
  const t = tags.split(' ')
  foods.set(slug, {
    slug, name, local, category, kind: 'ingredient',
    // rounded as stored, so dishes computed here match the app's own math
    p: r1(v.p), c: r1(v.c), f: r1(v.f), fib: r1(v.fib),
    diet: t.includes('nonveg') ? 'nonveg' : t.includes('egg') ? 'egg' : 'veg',
    vegan: t.includes('vegan'),
    jain: !t.includes('nonveg') && !t.includes('egg') && !t.includes('rootveg') && slug !== 'honey',
    fasting: t.includes('fasting'),
    allergens: allergens ? allergens.split(' ') : [],
    measures: [...measures.map(([label, g]) => ({ label, grams: g })), { label: '100 g', grams: 100 }],
    recipe: null, yieldG: null,
    source, ref, verified: source === 'ifct2017', note: note || (source === 'label' ? 'Typical label values — confirm against the brand your client uses' : null),
  })
}

// ── Dishes ──
const report = []
for (const [slug, name, local, category, serving, yieldG, recipe, extra = ''] of DISHES) {
  if (foods.has(slug)) throw new Error(`Duplicate slug ${slug}`)
  const parts = recipe.map(([s, g]) => {
    const ing = foods.get(s)
    if (!ing || ing.kind !== 'ingredient') throw new Error(`${slug}: unknown ingredient ${s}`)
    return { ing, g }
  })
  const sum = (k) => parts.reduce((t, { ing, g }) => t + (ing[k] * g) / 100, 0)
  const per100 = (k) => (sum(k) / yieldG) * 100
  const diet = parts.some((x) => x.ing.diet === 'nonveg') ? 'nonveg' : parts.some((x) => x.ing.diet === 'egg') ? 'egg' : 'veg'
  foods.set(slug, {
    slug, name, local, category, kind: 'dish',
    p: per100('p'), c: per100('c'), f: per100('f'), fib: per100('fib'),
    diet,
    vegan: parts.every((x) => x.ing.vegan),
    jain: diet === 'veg' && parts.every((x) => x.ing.jain),
    fasting: extra.includes('fasting') || parts.every((x) => x.ing.fasting),
    allergens: [...new Set(parts.flatMap((x) => x.ing.allergens))],
    measures: [{ label: `${serving} (${yieldG} g)`, grams: yieldG, default: true }, { label: '100 g', grams: 100 }],
    recipe: recipe.map(([s, g]) => ({ slug: s, grams: g })), yieldG,
    source: 'recipe', ref: null,
    verified: parts.every((x) => x.ing.verified),
    note: null,
  })
  report.push([name, serving, Math.round(kcal({ p: sum('p'), c: sum('c'), f: sum('f'), fib: sum('fib') })), r1(sum('p')), r1(sum('c')), r1(sum('f'))])
}

// ── SQL ──
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const arr = (a) => (a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`)
const json = (o) => (o === null ? 'null' : `${q(JSON.stringify(o))}::jsonb`)

const values = [...foods.values()].map((x) => `(${[
  q(x.slug), q(x.name), q(x.local), q(x.category), q(x.kind),
  r1(kcal(x)), r1(x.p), r1(x.c), r1(x.f), r1(x.fib),
  q(x.diet), x.vegan, x.jain, x.fasting, arr(x.allergens),
  json(x.measures), json(x.recipe), x.yieldG ?? 'null',
  q(x.source), q(x.ref), x.verified, q(x.note),
].join(', ')})`)

const schema = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8')
const sql = `${schema}
-- ── Seed: ${INGREDIENTS.length} ingredients + ${DISHES.length} dishes (generated by scripts/nutrition/build-seed.mjs) ──
-- Existing rows are never overwritten, so the coach's edits survive a re-run.
insert into public.foods
  (slug, name, local_name, category, kind, kcal, protein_g, carbs_g, fat_g, fibre_g,
   diet, is_vegan, is_jain_ok, is_fasting_ok, allergens, measures, recipe, recipe_yield_g,
   source, source_ref, verified, notes)
values
${values.join(',\n')}
on conflict (slug) do nothing;

-- Check: should show ${foods.size} foods (more if you have added your own).
select kind, count(*) from public.foods group by kind order by kind;
`
fs.writeFileSync(path.join(here, '../../supabase/nutrition_foods.sql'), sql)

console.log(`Wrote ${foods.size} foods.\n`)
console.log('Dish (per serving) | kcal | P | C | F')
for (const r of report) console.log(`${r[0]} · ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} | ${r[5]}`)
