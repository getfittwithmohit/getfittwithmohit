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
-- Hindi/Marathi versions for "Send to whoever's cooking", made on first use:
-- { "hi": { "at": "<recipe updated_at>", "title": …, "names": {slug: name}, "extras": […], "steps": […], "tip": … } }
alter table public.recipes add column if not exists translations jsonb not null default '{}';

create index if not exists recipes_status on public.recipes (status);
create index if not exists recipes_dish_food on public.recipes (dish_food) where status = 'approved';

alter table public.recipes enable row level security;

drop policy if exists recipes_coach_all on public.recipes;
create policy recipes_coach_all on public.recipes
  for all to authenticated using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists recipes_read_approved on public.recipes;
create policy recipes_read_approved on public.recipes
  for select to authenticated using (status = 'approved');

-- ── Recipe Autopilot ────────────────────────────────────────────────────────
-- source:  'coach' (made in the editor) or 'autopilot'
-- review:  the AI reviewer's verdict { "verdict": "publish"|"needs_coach", "reason": "…", "notes": [...] }
-- likes / dislikes: "Would you cook this again?" from clients
alter table public.recipes add column if not exists source   text not null default 'coach';
alter table public.recipes add column if not exists review   jsonb;
alter table public.recipes add column if not exists likes    integer not null default 0;
alter table public.recipes add column if not exists dislikes integer not null default 0;

-- One vote per client per recipe (written by the server only)
create table if not exists public.recipe_feedback (
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  liked      boolean not null,
  created_at timestamptz not null default now(),
  primary key (recipe_id, client_id)
);
alter table public.recipe_feedback enable row level security;
drop policy if exists recipe_feedback_coach_read on public.recipe_feedback;
create policy recipe_feedback_coach_read on public.recipe_feedback
  for select to authenticated using (public.gfm_is_coach());

-- Autopilot switch and last run (a single row)
create table if not exists public.recipe_settings (
  id           integer primary key default 1 check (id = 1),
  autopilot    boolean not null default true,
  last_run_at  timestamptz,
  last_summary jsonb
);
insert into public.recipe_settings (id) values (1) on conflict (id) do nothing;
alter table public.recipe_settings enable row level security;
drop policy if exists recipe_settings_coach_all on public.recipe_settings;
create policy recipe_settings_coach_all on public.recipe_settings
  for all to authenticated using (public.gfm_is_coach()) with check (public.gfm_is_coach());
