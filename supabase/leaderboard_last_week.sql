-- ============================================================================
-- GetFittWithMohit — Leaderboard: "Last week" tab + check-in days
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/daily_checkins_and_xp.sql to have been run first.
--
-- Changes gfm_leaderboard():
--   - p_period now also accepts 'last_week' (previous Monday–Sunday, India time)
--   - 'week' is now explicitly bounded to this Monday–Sunday
--   - new output column checkin_days: on-time daily check-ins in the period
--     (same rule as XP: submitted on its own India-time day)
-- No tables or data change. Undo with leaderboard_last_week_rollback.sql.
-- ============================================================================

-- The return columns change, so the old function must be dropped first.
drop function if exists public.gfm_leaderboard(text);

create function public.gfm_leaderboard(p_period text default 'week')
returns table (
  rank          integer,
  client_id     uuid,
  display_name  text,
  xp            integer,
  checkin_days  integer,
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
  v_this_monday date := date_trunc('week', gfm_today_ist())::date;
  v_from date;
  v_to date;
begin
  select c.id into v_me from clients c where c.auth_user_id = auth.uid() limit 1;

  if not v_coach and (v_me is null or not gfm_is_active_client()) then
    raise exception 'Leaderboard is only available to active clients';
  end if;

  if p_period = 'all' then
    v_from := date '1900-01-01';
    v_to   := date '9999-12-31';
  elsif p_period = 'last_week' then
    v_from := v_this_monday - 7;
    v_to   := v_this_monday - 1;
  elsif p_period = 'week' then
    v_from := v_this_monday;
    v_to   := v_this_monday + 6;
  else
    raise exception 'Unknown leaderboard period: %', p_period;
  end if;

  return query
  with totals as (
    select e.client_id, sum(e.points)::int as xp
    from gfm_xp_events() e
    where e.event_date between v_from and v_to
    group by e.client_id
  ),
  days as (
    select d.client_id, count(*)::int as n
    from daily_checkins d
    where d.checkin_date between v_from and v_to
      and gfm_ist_date(d.submitted_at) = d.checkin_date
    group by d.client_id
  ),
  visible as (
    select c.id, c.full_name, c.leaderboard_hidden
    from clients c
    where coalesce(c.status, 'active') = 'active'
      and (v_coach or not c.leaderboard_hidden or c.id = v_me)
  ),
  scored as (
    select v.id, v.full_name, v.leaderboard_hidden,
           coalesce(t.xp, 0) as xp, coalesce(dd.n, 0) as checkin_days
    from visible v
    left join totals t on t.client_id = v.id
    left join days dd on dd.client_id = v.id
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
    s.checkin_days,
    s.id = v_me,
    s.leaderboard_hidden
  from scored s
  order by s.xp desc, s.full_name;
end;
$$;

revoke all on function public.gfm_leaderboard(text) from public, anon;
grant execute on function public.gfm_leaderboard(text) to authenticated;
