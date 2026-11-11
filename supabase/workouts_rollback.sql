-- ============================================================================
-- Workout plans — ROLLBACK. Deletes all workout data and the exercise library.
-- Also restores gfm_xp_events() to the rules it had before workouts.
-- ============================================================================
drop function if exists public.gfm_copy_plan(uuid, uuid, date, text);
drop trigger if exists workout_logs_guard on public.workout_logs;
drop function if exists public.gfm_guard_workout_log_update();
drop table if exists public.workout_pain_flags;
drop table if exists public.workout_sets;
drop table if exists public.workout_logs;
drop table if exists public.plan_exercises;
drop table if exists public.plan_sessions;
drop table if exists public.workout_plans;
drop table if exists public.exercises;

-- Restore XP rules without the workout entries
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
  -- weekly_checkins.submitted_at is 'timestamp without time zone' holding UTC
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
$$;

revoke all on function public.gfm_xp_events(uuid) from public, anon, authenticated;
