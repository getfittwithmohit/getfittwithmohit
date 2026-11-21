-- ============================================================================
-- Onboarding + weekly check-in v2 — ADDITIVE ONLY
-- Adds new, optional columns. Nothing is dropped, renamed or changed, and it
-- is safe to run more than once. Existing rows keep NULL in the new columns.
-- The app works before and after this runs: if a new column is missing it
-- retries the save without the new answers, so existing data is never lost.
-- Run in Supabase → SQL Editor.
-- ============================================================================

-- Starting measurements: same five sites as the weekly check-in, plus trouser size
alter table public.body_metrics add column if not exists lower_belly_inches numeric;
alter table public.body_metrics add column if not exists thigh_inches numeric;
alter table public.body_metrics add column if not exists trouser_waist_size text;

-- Lifestyle: alcohol and smoking
alter table public.lifestyle add column if not exists alcohol_frequency text;
alter table public.lifestyle add column if not exists smoking text;

-- Fitness: preferred training time and wearable
alter table public.fitness_background add column if not exists preferred_training_time text;
alter table public.fitness_background add column if not exists fitness_tracker text;

-- Weekly check-in: new questions (chest/hip are already saved by the app;
-- listed here only so the script is complete on a fresh database)
alter table public.weekly_checkins add column if not exists chest_inches numeric;
alter table public.weekly_checkins add column if not exists hip_inches numeric;
alter table public.weekly_checkins add column if not exists drinks_this_week text;
alter table public.weekly_checkins add column if not exists hunger_level integer;
alter table public.weekly_checkins add column if not exists cycle_phase text;
alter table public.weekly_checkins add column if not exists trouser_waist_size text;

-- Check: should list 13 columns
select table_name, column_name from information_schema.columns
where table_schema = 'public' and (
  (table_name = 'body_metrics' and column_name in ('lower_belly_inches','thigh_inches','trouser_waist_size')) or
  (table_name = 'lifestyle' and column_name in ('alcohol_frequency','smoking')) or
  (table_name = 'fitness_background' and column_name in ('preferred_training_time','fitness_tracker')) or
  (table_name = 'weekly_checkins' and column_name in ('chest_inches','hip_inches','drinks_this_week','hunger_level','cycle_phase','trouser_waist_size'))
) order by table_name, column_name;
