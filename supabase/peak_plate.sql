-- ============================================================================
-- GetFittWithMohit — PEAK Plate (AI meal scan) v1
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/courses_and_audios.sql (gfm_is_coach()).
--
-- No changes to EXISTING tables. Two new tables:
--   meal_logs     — one row per scan. logged = true once the person saves it
--                   to their day. Photos are NEVER stored: the app sends the
--                   photo straight to the AI and keeps only the text result.
--   plate_targets — daily targets for anyone the Fat Loss Blueprint can't
--                   cover (the coach testing it, or a client missing
--                   height/weight).
--
-- Rows are keyed by the login (auth user id), not the clients table, so the
-- coach account can use PEAK Plate too. client_id is filled in for clients.
--
-- Everyone only READS their own rows directly. Every write goes through the
-- app's /api/plate/* routes (service role), which enforce the daily scan cap.
--
-- To undo: supabase/peak_plate_rollback.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION A — meal_logs
-- ----------------------------------------------------------------------------

create table if not exists public.meal_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete cascade,
  meal_date    date not null,                       -- India calendar day
  meal_type    text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  source       text not null check (source in ('photo', 'text')),
  title        text not null,
  emoji        text not null default '🍽️',
  items        jsonb not null default '[]'::jsonb,  -- [{name, unit, quantity, per_unit:{calories, protein_g, carbs_g, fat_g, fibre_g}}]
  calories     integer not null default 0,
  protein_g    numeric(6,1) not null default 0,
  carbs_g      numeric(6,1) not null default 0,
  fat_g        numeric(6,1) not null default 0,
  fibre_g      numeric(6,1) not null default 0,
  score        integer not null check (score between 1 and 10),
  verdict      text not null check (verdict in ('peak', 'good', 'fix')),
  headline     text,
  flags        jsonb not null default '[]'::jsonb,  -- [{label, detail}]
  swaps        jsonb not null default '[]'::jsonb,  -- [{change, impact}]
  assumptions  text,
  confidence   text check (confidence in ('high', 'medium', 'low')),
  analyses     integer not null default 1,          -- AI calls used (scan + re-checks), for the daily cap
  logged       boolean not null default false,
  logged_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists meal_logs_user_date_idx on public.meal_logs(user_id, meal_date);
create index if not exists meal_logs_client_date_idx on public.meal_logs(client_id, meal_date);

alter table public.meal_logs enable row level security;

drop policy if exists "coach full access" on public.meal_logs;
create policy "coach full access" on public.meal_logs
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "user reads own rows" on public.meal_logs;
create policy "user reads own rows" on public.meal_logs
  for select using (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- SECTION B — plate_targets
-- ----------------------------------------------------------------------------

create table if not exists public.plate_targets (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  calories   integer not null check (calories between 800 and 6000),
  protein_g  integer not null check (protein_g between 20 and 400),
  carbs_g    integer not null check (carbs_g between 0 and 800),
  fat_g      integer not null check (fat_g between 10 and 300),
  fibre_g    integer not null check (fibre_g between 5 and 100),
  updated_at timestamptz not null default now()
);

alter table public.plate_targets enable row level security;

drop policy if exists "coach full access" on public.plate_targets;
create policy "coach full access" on public.plate_targets
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "user reads own row" on public.plate_targets;
create policy "user reads own row" on public.plate_targets
  for select using (user_id = auth.uid());
