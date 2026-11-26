-- ============================================================================
-- GetFittWithMohit — Eat tab: meal ticks
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/courses_and_audios.sql (gfm_is_coach()),
--          supabase/peak_plate.sql (meal_logs).
--
-- No changes to EXISTING tables. One new table:
--   meal_ticks — one row per client, per day, per plan meal: did they eat
--                the plan ('ate'), something else ('else'), or skip it.
--                protein_g / kcal are worked out by the app from the plan
--                (or from a PEAK Plate scan); null means "not known".
--
-- Clients only READ their own rows directly. Every write goes through the
-- app's /api/me/meals route (service role), which checks the meal against
-- the client's published plan.
--
-- To undo: supabase/meal_ticks_rollback.sql
-- ============================================================================

create table if not exists public.meal_ticks (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  tick_date     date not null,                       -- India calendar day
  meal_id       text not null,                       -- the plan meal's id
  meal_name     text not null,
  status        text not null check (status in ('ate', 'else', 'skipped')),
  option_id     text,                                -- which plan option, when 'ate'
  option_title  text,
  protein_g     numeric(6,1),
  kcal          integer,
  plate_log_id  uuid references public.meal_logs(id) on delete set null,
  plan_version  integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, tick_date, meal_id)
);
create index if not exists meal_ticks_client_date_idx on public.meal_ticks(client_id, tick_date);

alter table public.meal_ticks enable row level security;

drop policy if exists "coach full access" on public.meal_ticks;
create policy "coach full access" on public.meal_ticks
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "client reads own rows" on public.meal_ticks;
create policy "client reads own rows" on public.meal_ticks
  for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));
