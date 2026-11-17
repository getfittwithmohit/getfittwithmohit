-- ============================================================================
-- GetFittWithMohit — ROLLBACK for supabase/leaderboard_last_week.sql
-- Restores the original gfm_leaderboard() (This week / All time only).
-- No data is affected. Revert the app code first, or the "Last week" tab errors.
-- ============================================================================

drop function if exists public.gfm_leaderboard(text);

create function public.gfm_leaderboard(p_period text default 'week')
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
