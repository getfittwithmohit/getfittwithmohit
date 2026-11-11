-- ============================================================================
-- Daily check-in: goal writing + affirmations become client ticks
-- (gratitude_done already exists). Additive and safe to re-run.
-- Undo:
--   alter table public.daily_checkins drop column if exists goal_writing_done;
--   alter table public.daily_checkins drop column if exists affirmations_done;
-- ============================================================================

alter table public.daily_checkins add column if not exists goal_writing_done boolean not null default false;
alter table public.daily_checkins add column if not exists affirmations_done boolean not null default false;
