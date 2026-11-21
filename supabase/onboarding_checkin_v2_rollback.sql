-- Rollback for onboarding_checkin_v2.sql. Removes ONLY what it added.
-- chest_inches / hip_inches on weekly_checkins are left alone: the app saved
-- them before this change.
alter table public.body_metrics drop column if exists lower_belly_inches;
alter table public.body_metrics drop column if exists thigh_inches;
alter table public.body_metrics drop column if exists trouser_waist_size;
alter table public.lifestyle drop column if exists alcohol_frequency;
alter table public.lifestyle drop column if exists smoking;
alter table public.fitness_background drop column if exists preferred_training_time;
alter table public.fitness_background drop column if exists fitness_tracker;
alter table public.weekly_checkins drop column if exists drinks_this_week;
alter table public.weekly_checkins drop column if exists hunger_level;
alter table public.weekly_checkins drop column if exists cycle_phase;
alter table public.weekly_checkins drop column if exists trouser_waist_size;
