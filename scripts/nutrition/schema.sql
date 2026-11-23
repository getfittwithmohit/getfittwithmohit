-- ============================================================================
-- GetFittWithMohit — Nutrition: food database
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run:
-- existing foods (including the coach's edits and custom foods) are kept.
-- Requires supabase/courses_and_audios.sql (gfm_is_coach()).
--
-- One table, public.foods:
--   kind 'ingredient' — values per 100 g (IFCT 2017 where available)
--   kind 'dish'       — a home-style recipe of ingredients (raw grams for one
--                       serving) + its cooked weight; values per 100 g cooked
--                       are computed from the recipe
-- measures: household measures for portions, e.g. [{"label":"1 katori (150 g)","grams":150}]
--
-- To undo: supabase/nutrition_foods_rollback.sql
-- ============================================================================

create table if not exists public.foods (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  local_name      text,
  category        text not null,
  kind            text not null default 'ingredient' check (kind in ('ingredient', 'dish')),
  -- per 100 g (dishes: per 100 g cooked)
  kcal            numeric(7,1) not null,
  protein_g       numeric(6,1) not null,
  carbs_g         numeric(6,1) not null,
  fat_g           numeric(6,1) not null,
  fibre_g         numeric(6,1) not null default 0,
  diet            text not null default 'veg' check (diet in ('veg', 'egg', 'nonveg')),
  is_vegan        boolean not null default false,
  is_jain_ok      boolean not null default false,
  is_fasting_ok   boolean not null default false,
  allergens       text[] not null default '{}',
  measures        jsonb not null default '[]',
  recipe          jsonb,
  recipe_yield_g  numeric(7,1),
  source          text not null default 'coach' check (source in ('ifct2017', 'recipe', 'label', 'coach')),
  source_ref      text,
  verified        boolean not null default false,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists foods_category_idx on public.foods (category);
create index if not exists foods_name_idx on public.foods (lower(name));

-- Everyone signed in can read the food list (clients see foods in their plan);
-- only the coach can add or change foods.
alter table public.foods enable row level security;
drop policy if exists "signed-in read" on public.foods;
create policy "signed-in read" on public.foods for select using (auth.role() = 'authenticated');
drop policy if exists "coach write" on public.foods;
create policy "coach write" on public.foods for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());
