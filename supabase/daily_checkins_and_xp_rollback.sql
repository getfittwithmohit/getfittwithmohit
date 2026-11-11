-- ============================================================================
-- GetFittWithMohit — Daily Check-In + XP — ROLLBACK
-- Undoes supabase/daily_checkins_and_xp.sql.
-- THIS DELETES ALL DAILY CHECK-IN ROWS and the leaderboard_hidden setting.
-- XP itself is never stored, so nothing else is lost.
-- ============================================================================

drop function if exists public.gfm_client_xp(uuid);
drop function if exists public.gfm_leaderboard(text);
drop function if exists public.gfm_xp_events(uuid);
drop function if exists public.gfm_today_ist();
drop function if exists public.gfm_ist_date(timestamptz);
drop table if exists public.daily_checkins;
alter table public.clients drop column if exists leaderboard_hidden;
