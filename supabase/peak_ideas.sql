-- ============================================================================
-- PEAK Ideas — one powerful idea a day, turned into one small action.
--
-- Safe to re-run. Creates only NEW tables and functions, and replaces
-- gfm_xp_events() to add two PEAK Ideas XP rules (every existing rule is kept
-- exactly as it was).
-- Requires: courses_and_audios.sql, daily_checkins_and_xp.sql, workouts.sql.
-- Undo: supabase/peak_ideas_rollback.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION A — the ideas (written by AI, approved by Coach Mohit)
-- ----------------------------------------------------------------------------

create table if not exists public.peak_ideas (
  id              uuid primary key default gen_random_uuid(),
  topic           text not null check (topic in ('Consistency','Identity','Nutrition','Focus','Sleep','Mindset')),
  kind            text not null default 'original' check (kind in ('original','book')),
  book_title      text,
  book_author     text,
  book_order      integer,
  hook            text not null,                 -- panel 1: one line that stops the scroll
  body            text not null,                 -- panel 2: the idea (paragraphs split by a blank line)
  action          text not null,                 -- panel 3: one small thing to do today
  easier_action   text not null,                 -- for low days
  coach_take      text,                          -- one line in Coach Mohit's voice
  recall_question text not null,
  recall_options  text[] not null check (array_length(recall_options, 1) = 3),
  recall_answer   integer not null check (recall_answer between 0 and 2),
  triggers        text[] not null default '{}',  -- when it is the right idea: see gfm_peak_signals()
  status          text not null default 'draft' check (status in ('draft','approved','archived')),
  quality_score   integer,                       -- from the AI editor pass, 1–10
  created_at      timestamptz not null default now(),
  approved_at     timestamptz,
  check (kind = 'original' or (book_title is not null and book_author is not null))
);
create index if not exists peak_ideas_status_idx on public.peak_ideas(status);
create index if not exists peak_ideas_book_idx on public.peak_ideas(book_title) where kind = 'book';


-- ----------------------------------------------------------------------------
-- SECTION B — each client's ideas (one row per client per idea)
-- ----------------------------------------------------------------------------

create table if not exists public.peak_client_ideas (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  idea_id       uuid not null references public.peak_ideas(id) on delete cascade,
  day           date not null,                         -- IST day it was given
  is_daily      boolean not null default false,        -- the idea of the day (vs "one more" / browsed)
  opened_at     timestamptz,
  committed_at  timestamptz,                           -- tapped "I'll do it"
  chose_easier  boolean not null default false,
  outcome       text check (outcome in ('done','not_yet')),
  outcome_at    timestamptz,
  reaction      smallint check (reaction in (-1, 1)),  -- more / less like this
  saved_at      timestamptz,
  created_at    timestamptz not null default now(),
  unique (client_id, idea_id)
);
create index if not exists peak_client_ideas_client_day_idx on public.peak_client_ideas(client_id, day desc);
-- One idea of the day per client per day
create unique index if not exists peak_client_ideas_one_daily
  on public.peak_client_ideas(client_id, day) where is_daily;

create table if not exists public.peak_recalls (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  idea_id      uuid not null references public.peak_ideas(id) on delete cascade,
  step         integer not null check (step in (1, 2)),  -- 1 = 3 days after saving, 2 = 10 days later
  due_date     date not null,
  answered_at  timestamptz,
  correct      boolean,
  created_at   timestamptz not null default now(),
  unique (client_id, idea_id, step)
);
create index if not exists peak_recalls_due_idx on public.peak_recalls(client_id, due_date) where answered_at is null;


-- ----------------------------------------------------------------------------
-- SECTION C — guard: clients may only change their own reactions to an idea
-- ----------------------------------------------------------------------------

create or replace function public.gfm_peak_guard()
returns trigger
language plpgsql
as $$
begin
  if gfm_is_coach() then return new; end if;
  if new.client_id <> old.client_id or new.idea_id <> old.idea_id
     or new.day <> old.day or new.is_daily <> old.is_daily then
    raise exception 'This idea row cannot be moved';
  end if;
  -- a promise can only be reported once it was made, and only once
  if new.outcome is distinct from old.outcome then
    if new.committed_at is null then raise exception 'Commit to the action first'; end if;
    if old.outcome = 'done' then raise exception 'Already marked done'; end if;
    new.outcome_at := now();
  end if;
  if new.committed_at is distinct from old.committed_at and old.committed_at is not null then
    new.committed_at := old.committed_at;   -- the first commitment time stands
  end if;
  return new;
end;
$$;

drop trigger if exists peak_client_ideas_guard on public.peak_client_ideas;
create trigger peak_client_ideas_guard
  before update on public.peak_client_ideas
  for each row execute function public.gfm_peak_guard();

-- Saving an idea schedules its first recall (3 days later)
create or replace function public.gfm_peak_schedule_recall()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.saved_at is not null and (tg_op = 'INSERT' or old.saved_at is null) then
    insert into peak_recalls (client_id, idea_id, step, due_date)
    values (new.client_id, new.idea_id, 1, gfm_today_ist() + 3)
    on conflict (client_id, idea_id, step) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists peak_client_ideas_recall on public.peak_client_ideas;
create trigger peak_client_ideas_recall
  after insert or update of saved_at on public.peak_client_ideas
  for each row execute function public.gfm_peak_schedule_recall();


-- ----------------------------------------------------------------------------
-- SECTION D — row level security
-- ----------------------------------------------------------------------------

alter table public.peak_ideas enable row level security;
alter table public.peak_client_ideas enable row level security;
alter table public.peak_recalls enable row level security;

drop policy if exists "coach full access" on public.peak_ideas;
create policy "coach full access" on public.peak_ideas
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "active clients read approved" on public.peak_ideas;
create policy "active clients read approved" on public.peak_ideas
  for select using (status = 'approved' and public.gfm_is_active_client());

drop policy if exists "coach full access" on public.peak_client_ideas;
create policy "coach full access" on public.peak_client_ideas
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "client reads own rows" on public.peak_client_ideas;
create policy "client reads own rows" on public.peak_client_ideas
  for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));

drop policy if exists "client updates own rows" on public.peak_client_ideas;
create policy "client updates own rows" on public.peak_client_ideas
  for update using (client_id in (select id from public.clients where auth_user_id = auth.uid()) and public.gfm_is_active_client())
  with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));
-- (rows are created only through the functions below)

drop policy if exists "coach full access" on public.peak_recalls;
create policy "coach full access" on public.peak_recalls
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

drop policy if exists "client reads own rows" on public.peak_recalls;
create policy "client reads own rows" on public.peak_recalls
  for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));
-- (answers go through gfm_peak_answer_recall so they can't be faked)


-- ----------------------------------------------------------------------------
-- SECTION E — picking the right idea for the right client on the right day
-- ----------------------------------------------------------------------------

-- Who is calling? Returns the client id the caller may act for, or raises.
create or replace function public.gfm_peak_caller(p_client_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if gfm_is_coach() then return p_client_id; end if;
  if not gfm_is_active_client() or not exists (
    select 1 from clients where id = p_client_id and auth_user_id = auth.uid()
  ) then
    raise exception 'PEAK Ideas is only available to active clients';
  end if;
  return p_client_id;
end;
$$;

-- What is going on with this client right now? Read from their last 2 daily check-ins.
--   missed_workout · low_sleep · low_energy · overeating · comeback · new_start · needs_support
create or replace function public.gfm_peak_signals(p_client_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select * from daily_checkins
    where client_id = p_client_id and checkin_date >= gfm_today_ist() - 2
  ), last_any as (
    select max(checkin_date) d from daily_checkins where client_id = p_client_id
  )
  select array_remove(array[
    case when exists (select 1 from recent where workout_status = 'skipped') then 'missed_workout' end,
    case when exists (select 1 from recent where sleep_hours < 6 or sleep_quality <= 4) then 'low_sleep' end,
    case when exists (select 1 from recent where energy <= 4) then 'low_energy' end,
    case when exists (select 1 from recent where nutrition_score <= 5) then 'overeating' end,
    case when exists (select 1 from recent where support_needed) then 'needs_support' end,
    case when (select d from last_any) < gfm_today_ist() - 3 then 'comeback' end,
    case when (select count(*) from peak_client_ideas where client_id = p_client_id) < 7 then 'new_start' end
  ], null);
$$;

-- Give the client a new idea. Daily = the idea of the day; otherwise "one more".
create or replace function public.gfm_peak_assign(p_client_id uuid, p_daily boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := gfm_today_ist();
  v_signals text[] := gfm_peak_signals(p_client_id);
  v_yesterday_topic text;
  v_idea uuid;
  v_row uuid;
begin
  select i.topic into v_yesterday_topic
  from peak_client_ideas c join peak_ideas i on i.id = c.idea_id
  where c.client_id = p_client_id and c.day < v_today and c.is_daily
  order by c.day desc limit 1;

  with taste as (
    -- +1 / -1 reactions and saves teach us which topics land for this person
    select i.topic,
           sum(coalesce(c.reaction, 0)) + 0.5 * count(c.saved_at) as score
    from peak_client_ideas c join peak_ideas i on i.id = c.idea_id
    where c.client_id = p_client_id
    group by i.topic
  ), candidates as (
    select i.id,
           -- the right idea at the right moment matters most
           3 * cardinality(array(select unnest(i.triggers) intersect select unnest(v_signals)))
           + coalesce(least(greatest(t.score, -3), 3), 0)
           - case when i.topic = v_yesterday_topic then 2 else 0 end
           -- daily ideas are originals; book ideas are read in the books section
           - case when i.kind = 'book' then 1 else 0 end
           + random() as score
    from peak_ideas i
    left join taste t on t.topic = i.topic
    where i.status = 'approved'
      and not exists (select 1 from peak_client_ideas c where c.client_id = p_client_id and c.idea_id = i.id)
  )
  select id into v_idea from candidates order by score desc limit 1;

  if v_idea is null then return null; end if;   -- they've seen every idea

  insert into peak_client_ideas (client_id, idea_id, day, is_daily)
  values (p_client_id, v_idea, v_today, p_daily)
  on conflict do nothing
  returning id into v_row;
  return v_row;
end;
$$;

-- Today's idea (assigned on first call of the day). Returns the peak_client_ideas id.
create or replace function public.gfm_peak_today(p_client_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := gfm_peak_caller(p_client_id);
  v_row uuid;
begin
  select id into v_row from peak_client_ideas
  where client_id = v_client and day = gfm_today_ist() and is_daily;
  if v_row is not null then return v_row; end if;
  v_row := gfm_peak_assign(v_client, true);
  if v_row is null then   -- another tab got there first, or nothing left to give
    select id into v_row from peak_client_ideas
    where client_id = v_client and day = gfm_today_ist() and is_daily;
  end if;
  return v_row;
end;
$$;

-- "One more idea" — up to 3 extra a day, so the daily idea stays the hero.
create or replace function public.gfm_peak_more(p_client_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := gfm_peak_caller(p_client_id);
begin
  if (select count(*) from peak_client_ideas
      where client_id = v_client and day = gfm_today_ist() and not is_daily) >= 3 then
    raise exception 'That''s plenty for today. One idea you act on beats ten you read.';
  end if;
  return gfm_peak_assign(v_client, false);
end;
$$;

-- Open a specific approved idea (from the books section). Returns the row id.
create or replace function public.gfm_peak_open(p_client_id uuid, p_idea_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := gfm_peak_caller(p_client_id);
  v_row uuid;
begin
  if not exists (select 1 from peak_ideas where id = p_idea_id and status = 'approved') then
    raise exception 'Idea not found';
  end if;
  insert into peak_client_ideas (client_id, idea_id, day, is_daily)
  values (v_client, p_idea_id, gfm_today_ist(), false)
  on conflict (client_id, idea_id) do nothing;
  select id into v_row from peak_client_ideas where client_id = v_client and idea_id = p_idea_id;
  return v_row;
end;
$$;

-- Answer a recall question. Marks it, and schedules the final recall 10 days later.
create or replace function public.gfm_peak_answer_recall(p_recall_id uuid, p_choice integer)
returns table (correct boolean, answer integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  r peak_recalls;
  v_answer integer;
begin
  select * into r from peak_recalls where id = p_recall_id;
  if r.id is null then raise exception 'Recall not found'; end if;
  perform gfm_peak_caller(r.client_id);
  if r.due_date > gfm_today_ist() then raise exception 'This recall is not due yet'; end if;
  select recall_answer into v_answer from peak_ideas where id = r.idea_id;

  if r.answered_at is null then
    update peak_recalls set answered_at = now(), correct = (p_choice = v_answer) where id = r.id;
    if r.step = 1 then
      insert into peak_recalls (client_id, idea_id, step, due_date)
      values (r.client_id, r.idea_id, 2, gfm_today_ist() + 10)
      on conflict (client_id, idea_id, step) do nothing;
    end if;
  end if;
  return query select (p_choice = v_answer), v_answer;
end;
$$;

revoke all on function public.gfm_peak_signals(uuid) from public, anon;
revoke all on function public.gfm_peak_assign(uuid, boolean) from public, anon, authenticated;
grant execute on function public.gfm_peak_today(uuid) to authenticated;
grant execute on function public.gfm_peak_more(uuid) to authenticated;
grant execute on function public.gfm_peak_open(uuid, uuid) to authenticated;
grant execute on function public.gfm_peak_answer_recall(uuid, integer) to authenticated;


-- ----------------------------------------------------------------------------
-- SECTION F — XP. Same rules as before, plus:
--   Promise kept  +10  (did the action you committed to; once a day)
--   Idea recalled  +5  (answered a recall correctly; once a day)
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
  ),
  promises as (
    select distinct p.client_id, gfm_ist_date(p.outcome_at) as d
    from peak_client_ideas p
    where (p_client_id is null or p.client_id = p_client_id)
      and p.outcome = 'done' and p.committed_at is not null and p.outcome_at is not null
  ),
  recalls as (
    select distinct r.client_id, gfm_ist_date(r.answered_at) as d
    from peak_recalls r
    where (p_client_id is null or r.client_id = p_client_id)
      and r.correct
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
  union all
  select client_id, d, 'Promise kept (PEAK Idea)', 10 from promises
  union all
  select client_id, d, 'Idea recalled', 5 from recalls
$$;

revoke all on function public.gfm_xp_events(uuid) from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- Check: should show 3 tables with RLS on
-- ----------------------------------------------------------------------------
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename like 'peak_%' order by tablename;
