-- ============================================================================
-- GetFittWithMohit — Workout plans (phase 1)
--
-- Run the ENTIRE file in the Supabase SQL Editor, then run
-- supabase/workouts_seed_exercises.sql once to load the starter library.
-- Safe to re-run. Creates only NEW tables; replaces gfm_xp_events() to add
-- workout XP (all existing XP rules are kept unchanged).
-- Requires: courses_and_audios.sql and daily_checkins_and_xp.sql already run.
-- Undo: supabase/workouts_rollback.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION 0 — harden gfm_is_coach(): return false (not null) when the caller
-- has no email in their token, so "not gfm_is_coach()" checks can't be
-- skipped. Same coach email as before.
-- ----------------------------------------------------------------------------

create or replace function public.gfm_is_coach()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'getfittwithmohit@gmail.com', false);
$$;


-- ----------------------------------------------------------------------------
-- SECTION A — exercise library
-- ----------------------------------------------------------------------------

create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  muscle_group   text not null check (muscle_group in ('Chest','Back','Legs','Glutes','Shoulders','Arms','Core','Cardio','Full body','Mobility')),
  equipment      text not null,                       -- e.g. 'Barbell', 'Dumbbell', 'Bodyweight'
  locations      text[] not null default '{gym}',     -- any of: gym, home, hotel
  log_type       text not null check (log_type in ('weight_reps','reps','time','time_distance')),
  video_url      text,                                -- YouTube link, added by the coach
  cues           text[] not null default '{}',        -- 2–3 form cues shown to the client
  weight_step    numeric(4,2) not null default 2.5,   -- kg per +/- tap
  home_alt_id    uuid references public.exercises(id) on delete set null,
  hotel_alt_id   uuid references public.exercises(id) on delete set null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- SECTION B — plans
-- A template has client_id null. Assigning a template copies it to the client.
-- ----------------------------------------------------------------------------

create table if not exists public.workout_plans (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid references public.clients(id) on delete cascade,
  name                text not null,
  schedule_type       text not null default 'rolling' check (schedule_type in ('rolling','weekdays')),
  sessions_per_week   integer not null default 4 check (sessions_per_week between 1 and 7),
  start_date          date,
  weeks               integer check (weeks between 1 and 52),
  progression_enabled boolean not null default true,
  status              text not null default 'active' check (status in ('active','archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists workout_plans_client_idx on public.workout_plans(client_id);
-- One active plan per client
create unique index if not exists workout_plans_one_active
  on public.workout_plans(client_id) where client_id is not null and status = 'active';

create table if not exists public.plan_sessions (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.workout_plans(id) on delete cascade,
  label       text not null,                 -- 'A', 'B', …
  name        text not null,                 -- 'Upper', 'Lower', …
  sort_order  integer not null default 0,
  weekday     integer check (weekday between 1 and 7),  -- 1 = Monday; fixed-weekday plans only
  coach_note  text,
  created_at  timestamptz not null default now()
);
create index if not exists plan_sessions_plan_idx on public.plan_sessions(plan_id);

create table if not exists public.plan_exercises (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.plan_sessions(id) on delete cascade,
  exercise_id         uuid not null references public.exercises(id),
  sort_order          integer not null default 0,
  sets                integer not null default 3 check (sets between 1 and 20),
  target_reps         integer check (target_reps between 1 and 200),
  target_seconds      integer check (target_seconds between 1 and 7200),
  target_distance_km  numeric(5,2),
  rest_seconds        integer not null default 90 check (rest_seconds between 0 and 600),
  note                text,
  created_at          timestamptz not null default now()
);
create index if not exists plan_exercises_session_idx on public.plan_exercises(session_id);


-- ----------------------------------------------------------------------------
-- SECTION C — what the client actually did
-- ----------------------------------------------------------------------------

create table if not exists public.workout_logs (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  plan_id           uuid references public.workout_plans(id) on delete set null,
  session_id        uuid references public.plan_sessions(id) on delete set null,
  session_name      text not null,           -- kept even if the plan changes later
  status            text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  duration_seconds  integer,
  total_volume_kg   numeric(10,1),
  feel              text check (feel in ('easy','right','brutal')),
  coach_high_five   boolean not null default false
);
create index if not exists workout_logs_client_idx on public.workout_logs(client_id, started_at desc);

create table if not exists public.workout_sets (
  id                uuid primary key default gen_random_uuid(),
  log_id            uuid not null references public.workout_logs(id) on delete cascade,
  client_id         uuid not null references public.clients(id) on delete cascade,
  exercise_id       uuid not null references public.exercises(id),
  plan_exercise_id  uuid references public.plan_exercises(id) on delete set null,
  set_number        integer not null,
  weight_kg         numeric(6,2),
  reps              integer,
  seconds           integer,
  distance_km       numeric(6,2),
  is_pr             boolean not null default false,
  completed_at      timestamptz not null default now(),
  unique (log_id, exercise_id, set_number)
);
create index if not exists workout_sets_client_ex_idx on public.workout_sets(client_id, exercise_id);

create table if not exists public.workout_pain_flags (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  log_id       uuid references public.workout_logs(id) on delete set null,
  exercise_id  uuid references public.exercises(id),
  note         text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- SECTION D — row level security
-- Coach: everything. Active clients: read the library and their own plan;
-- read/write their own logs and sets. Pain flags are written through the
-- app's API (it also emails the coach); clients only read their own.
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['exercises','workout_plans','plan_sessions','plan_exercises','workout_logs','workout_sets','workout_pain_flags'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "coach full access" on public.%I;', t);
    execute format('create policy "coach full access" on public.%I for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());', t);
  end loop;
end $$;

drop policy if exists "active clients read library" on public.exercises;
create policy "active clients read library" on public.exercises
  for select using (is_active and public.gfm_is_active_client());

drop policy if exists "client reads own plan" on public.workout_plans;
create policy "client reads own plan" on public.workout_plans
  for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));

drop policy if exists "client reads own sessions" on public.plan_sessions;
create policy "client reads own sessions" on public.plan_sessions
  for select using (plan_id in (
    select p.id from public.workout_plans p join public.clients c on c.id = p.client_id
    where c.auth_user_id = auth.uid()));

drop policy if exists "client reads own plan exercises" on public.plan_exercises;
create policy "client reads own plan exercises" on public.plan_exercises
  for select using (session_id in (
    select s.id from public.plan_sessions s
    join public.workout_plans p on p.id = s.plan_id
    join public.clients c on c.id = p.client_id
    where c.auth_user_id = auth.uid()));

do $$
declare
  t text;
  own text := 'client_id in (select id from public.clients where auth_user_id = auth.uid())';
begin
  foreach t in array array['workout_logs','workout_sets'] loop
    execute format('drop policy if exists "client reads own rows" on public.%I;', t);
    execute format('create policy "client reads own rows" on public.%I for select using (%s);', t, own);
    execute format('drop policy if exists "client inserts own rows" on public.%I;', t);
    execute format('create policy "client inserts own rows" on public.%I for insert with check (%s and public.gfm_is_active_client());', t, own);
    execute format('drop policy if exists "client updates own rows" on public.%I;', t);
    execute format('create policy "client updates own rows" on public.%I for update using (%s) with check (%s);', t, own, own);
    execute format('drop policy if exists "client deletes own rows" on public.%I;', t);
    execute format('create policy "client deletes own rows" on public.%I for delete using (%s);', t, own);
  end loop;
end $$;

drop policy if exists "client reads own pain flags" on public.workout_pain_flags;
create policy "client reads own pain flags" on public.workout_pain_flags
  for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));

-- A client must not award themselves a coach high-five
create or replace function public.gfm_guard_workout_log_update()
returns trigger
language plpgsql
as $$
begin
  if not public.gfm_is_coach() and new.coach_high_five is distinct from old.coach_high_five then
    raise exception 'Only the coach can send a high-five';
  end if;
  return new;
end;
$$;
drop trigger if exists workout_logs_guard on public.workout_logs;
create trigger workout_logs_guard before update on public.workout_logs
  for each row execute function public.gfm_guard_workout_log_update();


-- ----------------------------------------------------------------------------
-- SECTION D2 — copy a plan (assign a template to a client, or save a client's
-- plan as a template) in one transaction. Coach only.
--   p_client_id null  → the copy is a template
--   p_client_id set   → the client's current active plan is archived first
-- ----------------------------------------------------------------------------

create or replace function public.gfm_copy_plan(p_plan_id uuid, p_client_id uuid, p_start_date date default null, p_name text default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new uuid;
  v_session record;
  v_new_session uuid;
begin
  if not coalesce(gfm_is_coach(), false) then
    raise exception 'Only the coach can copy plans';
  end if;

  if p_client_id is not null then
    update workout_plans set status = 'archived', updated_at = now()
    where client_id = p_client_id and status = 'active';
  end if;

  insert into workout_plans (client_id, name, schedule_type, sessions_per_week, start_date, weeks, progression_enabled, status)
  select p_client_id, coalesce(p_name, name), schedule_type, sessions_per_week,
         case when p_client_id is null then null else coalesce(p_start_date, start_date) end,
         weeks, progression_enabled, 'active'
  from workout_plans where id = p_plan_id
  returning id into v_new;

  if v_new is null then
    raise exception 'Plan not found';
  end if;

  for v_session in select * from plan_sessions where plan_id = p_plan_id order by sort_order loop
    insert into plan_sessions (plan_id, label, name, sort_order, weekday, coach_note)
    values (v_new, v_session.label, v_session.name, v_session.sort_order, v_session.weekday, v_session.coach_note)
    returning id into v_new_session;

    insert into plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, target_distance_km, rest_seconds, note)
    select v_new_session, exercise_id, sort_order, sets, target_reps, target_seconds, target_distance_km, rest_seconds, note
    from plan_exercises where session_id = v_session.id;
  end loop;

  return v_new;
end;
$$;

revoke all on function public.gfm_copy_plan(uuid, uuid, date, text) from public, anon;
grant execute on function public.gfm_copy_plan(uuid, uuid, date, text) to authenticated;


-- ----------------------------------------------------------------------------
-- SECTION E — XP. Same rules as before, plus:
--   Workout completed in the app          +20  (max one per day)
--   New personal best                     +15 each, max 2 per workout
-- ----------------------------------------------------------------------------

create or replace function public.gfm_xp_events(p_client_id uuid default null)
returns table (client_id uuid, event_date date, source text, points integer)
language sql
stable
security definer
set search_path = public
as $$
  with on_time as (
    select *
    from daily_checkins d
    where (p_client_id is null or d.client_id = p_client_id)
      and gfm_ist_date(d.submitted_at) = d.checkin_date
  ),
  runs as (
    select o.client_id, o.checkin_date,
           o.checkin_date - (row_number() over (partition by o.client_id order by o.checkin_date))::int as grp
    from on_time o
  ),
  streaks as (
    select r.client_id, r.checkin_date,
           row_number() over (partition by r.client_id, r.grp order by r.checkin_date) as day_in_streak
    from runs r
  ),
  workouts as (
    select distinct on (w.client_id, gfm_ist_date(w.completed_at))
           w.id, w.client_id, gfm_ist_date(w.completed_at) as d
    from workout_logs w
    where (p_client_id is null or w.client_id = p_client_id)
      and w.status = 'completed' and w.completed_at is not null
    order by w.client_id, gfm_ist_date(w.completed_at), w.completed_at
  ),
  prs as (
    select s.client_id, gfm_ist_date(l.completed_at) as d,
           row_number() over (partition by s.log_id order by s.completed_at) as n
    from workout_sets s
    join workout_logs l on l.id = s.log_id
    where (p_client_id is null or s.client_id = p_client_id)
      and s.is_pr and l.status = 'completed'
  )
  select client_id, checkin_date, 'Daily check-in', 10 from on_time
  union all
  select client_id, checkin_date, 'Workout done', 10 from on_time where workout_status = 'done'
  union all
  select client_id, checkin_date, 'Nutrition 8+', 5 from on_time where nutrition_score >= 8
  union all
  select client_id, checkin_date, 'Steps 8,000+', 5 from on_time where steps >= 8000
  union all
  select client_id, checkin_date, 'Sleep 7h+', 5 from on_time where sleep_hours >= 7
  union all
  select client_id, checkin_date, 'Water 3L+', 5 from on_time where water_litres >= 3
  union all
  select client_id, checkin_date, '7-day streak bonus', 25 from streaks where day_in_streak % 7 = 0
  union all
  select client_id, checkin_date, '30-day streak bonus', 100 from streaks where day_in_streak % 30 = 0
  union all
  select r.client_id, r.date::date, 'Full daily ritual', 10
  from daily_rituals r
  where (p_client_id is null or r.client_id = p_client_id)
    and coalesce(r.strangest_secret_done, false) and coalesce(r.goal_card_done, false)
    and coalesce(r.affirmations_done, false) and coalesce(r.goals_done, false)
    and coalesce(r.codex_done, false)
  union all
  select w.client_id, gfm_ist_date(w.submitted_at at time zone 'UTC'), 'Weekly check-in', 25
  from weekly_checkins w
  where (p_client_id is null or w.client_id = p_client_id)
    and w.submitted_at is not null
  union all
  select l.client_id, gfm_ist_date(l.completed_at), 'Course lesson completed', 5
  from lesson_progress l
  where (p_client_id is null or l.client_id = p_client_id)
  union all
  select a.client_id, gfm_ist_date(a.updated_at), 'Audio finished', 5
  from audio_progress a
  where (p_client_id is null or a.client_id = p_client_id)
    and a.completed
  union all
  select client_id, d, 'Workout completed in app', 20 from workouts
  union all
  select client_id, d, 'Personal best', 15 from prs where n <= 2
$$;

revoke all on function public.gfm_xp_events(uuid) from public, anon, authenticated;
