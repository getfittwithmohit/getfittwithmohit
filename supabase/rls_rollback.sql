-- ============================================================================
-- GetFitWithMohit — RLS rollback
--
-- Emergency use only: disables Row Level Security again on every table this
-- migration touched, restoring the previous (open) behavior, and reverts
-- the two storage buckets to public. Run this in the Supabase SQL Editor
-- if rls_hardening.sql broke something you need working again immediately
-- while you investigate.
--
-- This does NOT drop the policies/trigger/function created by
-- rls_hardening.sql — it just stops enforcing them, so re-running
-- rls_hardening.sql afterward puts you right back to the hardened state.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients','medical_history','fitness_background','lifestyle','nutrition',
    'psychology','expectations','hormonal_health',
    'assessments','weekly_checkins','commitment_pledges','identity_cards',
    'codex_data','daily_rituals','ritual_streaks','goal_cards','daily_goals',
    'affirmations','body_metrics','progress_photos','blood_work',
    'retention_alerts','review_calls','milestones'
  ] loop
    execute format('alter table public.%I disable row level security;', t);
  end loop;
end $$;

drop trigger if exists clients_guard_self_update_trigger on public.clients;

update storage.buckets set public = true where id in ('blood-work', 'progress-photos');
