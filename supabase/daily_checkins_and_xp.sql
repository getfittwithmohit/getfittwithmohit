-- ============================================================================
-- GetFittWithMohit — Daily Check-In + XP + Leaderboard
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/courses_and_audios.sql to have been run first (it uses
-- gfm_is_coach(), lesson_progress and audio_progress).
--
-- Changes to EXISTING objects (both additive):
--   - clients: new column leaderboard_hidden (default false)
--
-- Existing tables it READS (columns verified against the app code):
--   clients(id, auth_user_id, full_name, status, leaderboard_hidden)
--   weekly_checkins(client_id, submitted_at)
--   daily_rituals(client_id, date, strangest_secret_done, goal_card_done,
--                 affirmations_done, goals_done, codex_done)
--   lesson_progress(client_id, completed_at), audio_progress(client_id, completed, updated_at)
--
-- XP is NOT stored. It is computed on demand from the source rows by
-- gfm_xp_events(), so it can never be double-credited or drift, and changing
-- a rule here re-scores everyone consistently.
--
-- Every "day" is an India (Asia/Kolkata) calendar day.
--
-- To undo: supabase/daily_checkins_and_xp_rollback.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION A — daily_checkins table
-- Clients only READ their rows directly. Every write goes through the app's
-- /api/daily-checkin route (service role), which enforces the dates and the
-- on-time rule, so a client can't backdate an entry to farm XP.
-- ----------------------------------------------------------------------------

create table if not exists public.daily_checkins (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  checkin_date     date not null,
  workout_status   text not null check (workout_status in ('done', 'modified', 'skipped')),
  workout_note     text,
  nutrition_score  integer not null check (nutrition_score between 1 and 10),
  nutrition_note   text,
  steps            integer check (steps between 0 and 200000),
  sleep_hours      numeric(3,1) check (sleep_hours between 0 and 24),
  sleep_quality    integer check (sleep_quality between 1 and 10),
  energy           integer not null check (energy between 1 and 10),
  water_litres     numeric(3,1) check (water_litres between 0 and 20),
  gratitude_done   boolean not null default false,
  support_needed   boolean not null default false,
  support_message  text,
  support_resolved boolean not null default false,
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (client_id, checkin_date)
);
create index if not exists daily_checkins_date_idx on public.daily_checkins(checkin_date);

alter table public.daily_checkins enable row level security;

drop policy if exists "coach full access" on public.daily_checkins;
create policy "coach full access" on public.daily_checkins
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "client reads own rows" on public.daily_checkins;
create policy "client reads own rows" on public.daily_checkins
  for select
  using (client_id in (select id from public.clients where auth_user_id = auth.uid()));


-- ----------------------------------------------------------------------------
-- SECTION B — leaderboard visibility
-- A client can hide themselves; the coach can hide anyone (e.g. demo
-- profiles). The existing clients_guard_self_update trigger does not list
-- this column, so clients are allowed to change it on their own row.
-- ----------------------------------------------------------------------------

alter table public.clients add column if not exists leaderboard_hidden boolean not null default false;


-- ----------------------------------------------------------------------------
-- SECTION C — XP rules
-- One row per point award. Edit the numbers here to change the rules.
-- ----------------------------------------------------------------------------

create or replace function public.gfm_ist_date(ts timestamptz)
returns date
language sql
immutable
as $$ select (ts at time zone 'Asia/Kolkata')::date $$;

create or replace function public.gfm_today_ist()
returns date
language sql
stable
as $$ select public.gfm_ist_date(now()) $$;

-- Internal: every XP award for every client (or one client).
-- Not callable from the app directly — see SECTION D.
create or replace function public.gfm_xp_events(p_client_id uuid default null)
returns table (client_id uuid, event_date date, source text, points integer)
language sql
stable
security definer
set search_path = public
as $$
  with on_time as (
    -- Only check-ins submitted on their own day earn XP
    select *
    from daily_checkins d
    where (p_client_id is null or d.client_id = p_client_id)
      and gfm_ist_date(d.submitted_at) = d.checkin_date
  ),
  runs as (
    -- Consecutive on-time check-in days (gaps-and-islands)
    select o.client_id, o.checkin_date,
           o.checkin_date - (row_number() over (partition by o.client_id order by o.checkin_date))::int as grp
    from on_time o
  ),
  streaks as (
    select r.client_id, r.checkin_date,
           row_number() over (partition by r.client_id, r.grp order by r.checkin_date) as day_in_streak
    from runs r
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
  select w.client_id, gfm_ist_date(w.submitted_at::timestamptz), 'Weekly check-in', 25
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
$$;

revoke all on function public.gfm_xp_events(uuid) from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- SECTION D — functions the app calls
-- ----------------------------------------------------------------------------

-- Leaderboard. p_period: 'week' (Monday–Sunday, India time) or 'all'.
-- Clients see active, non-hidden clients plus themselves. The coach sees
-- every active client, including hidden ones (flagged), so demo profiles can
-- be hidden from the dashboard.
create or replace function public.gfm_leaderboard(p_period text default 'week')
returns table (
  rank          integer,
  client_id     uuid,
  display_name  text,
  xp            integer,
  is_me         boolean,
  is_hidden     boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_coach boolean := gfm_is_coach();
  v_me uuid;
  v_from date;
begin
  select c.id into v_me from clients c where c.auth_user_id = auth.uid() limit 1;

  if not v_coach and (v_me is null or not gfm_is_active_client()) then
    raise exception 'Leaderboard is only available to active clients';
  end if;

  v_from := case
    when p_period = 'all' then date '1900-01-01'
    else date_trunc('week', gfm_today_ist())::date
  end;

  return query
  with totals as (
    select e.client_id, sum(e.points)::int as xp
    from gfm_xp_events() e
    where e.event_date >= v_from
    group by e.client_id
  ),
  visible as (
    select c.id, c.full_name, c.leaderboard_hidden
    from clients c
    where coalesce(c.status, 'active') = 'active'
      and (v_coach or not c.leaderboard_hidden or c.id = v_me)
  ),
  scored as (
    select v.id, v.full_name, v.leaderboard_hidden, coalesce(t.xp, 0) as xp
    from visible v left join totals t on t.client_id = v.id
  )
  select
    (rank() over (order by s.xp desc))::int,
    s.id,
    case
      when v_coach then s.full_name
      -- "Priya Sharma" -> "Priya S."; a single-word name is shown as is
      when position(' ' in trim(s.full_name)) > 0 then
        split_part(trim(s.full_name), ' ', 1) || ' ' ||
        upper(left(regexp_replace(trim(s.full_name), '^.*\s', ''), 1)) || '.'
      else coalesce(nullif(trim(s.full_name), ''), 'Client')
    end,
    s.xp,
    s.id = v_me,
    s.leaderboard_hidden
  from scored s
  order by s.xp desc, s.full_name;
end;
$$;

revoke all on function public.gfm_leaderboard(text) from public, anon;
grant execute on function public.gfm_leaderboard(text) to authenticated;

-- XP history for one client: the caller themselves, or any client for the coach.
create or replace function public.gfm_client_xp(p_client_id uuid)
returns table (event_date date, source text, points integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not gfm_is_coach() and not exists (
    select 1 from clients c where c.id = p_client_id and c.auth_user_id = auth.uid()
  ) then
    raise exception 'Not allowed';
  end if;

  return query
  select e.event_date, e.source, e.points
  from gfm_xp_events(p_client_id) e
  order by e.event_date desc, e.points desc;
end;
$$;

revoke all on function public.gfm_client_xp(uuid) from public, anon;
grant execute on function public.gfm_client_xp(uuid) to authenticated;

-- ============================================================================
-- Done. After running:
--   1. Coach → Dashboard → Leaderboard → hide the demo profiles
--      (Priya Sharma, Arjun Verma) so real clients don't see them.
--   2. Log in as a client → Home → Daily Check-In → submit → confirm XP shows.
-- ============================================================================
