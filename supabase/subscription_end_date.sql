-- ============================================================================
-- Renewals: optional custom subscription end date per client.
-- Additive and safe to re-run. When empty, the app uses
-- start_date + program_duration_weeks as the end date.
-- Undo: alter table public.clients drop column if exists subscription_end_date;
-- ============================================================================

alter table public.clients add column if not exists subscription_end_date date;
