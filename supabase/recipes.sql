-- ============================================================================
-- GetFittWithMohit — Recipes
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/nutrition_foods.sql (foods) and gfm_is_coach().
--
-- One row per recipe. Quantities are for ONE client portion; the app scales
-- them for the family pot and re-weighs protein swaps. Every number the client
-- sees is calculated from the food library, never stored here.
--   ingredients: [{ "food": "<foods.slug>", "grams": 120, "prep": "crumbled", "is_protein": true }]
--   extras:      [{ "name": "Haldi", "amount": "¼ tsp" }]  spices/herbs, not counted in macros
--   steps:       [{ "text": "Heat oil…", "minutes": 2 }]
--   swaps:       [{ "food": "<foods.slug>", "note": "Press it 10 min first" }]
--   dish_food:   the dish slug in plans this recipe teaches (e.g. paneer-bhurji)
--
-- Coach: full access. Clients: read approved recipes only.
-- To undo: supabase/recipes_rollback.sql
-- ============================================================================

create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  protein_key   text not null check (protein_key in ('paneer','egg','chicken','fish','dal','soya','tofu','curd')),
  meal_types    text[] not null default '{}',
  diet          text not null default 'veg' check (diet in ('vegan','veg','egg','nonveg')),
  jain_ok       boolean not null default false,
  minutes       integer not null default 20,
  equipment     text[] not null default '{}',
  tags          text[] not null default '{}',
  portion_label text,
  ingredients   jsonb not null default '[]',
  extras        jsonb not null default '[]',
  steps         jsonb not null default '[]',
  tip           text,
  swaps         jsonb not null default '[]',
  dish_food     text,
  status        text not null default 'draft' check (status in ('draft','approved','rejected')),
  ai_model      text,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Added after the first version: safe on an existing table
alter table public.recipes add column if not exists extras jsonb not null default '[]';

create index if not exists recipes_status on public.recipes (status);
create index if not exists recipes_dish_food on public.recipes (dish_food) where status = 'approved';

alter table public.recipes enable row level security;

drop policy if exists recipes_coach_all on public.recipes;
create policy recipes_coach_all on public.recipes
  for all to authenticated using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists recipes_read_approved on public.recipes;
create policy recipes_read_approved on public.recipes
  for select to authenticated using (status = 'approved');
