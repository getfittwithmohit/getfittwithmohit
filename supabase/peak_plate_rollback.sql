-- Undo supabase/peak_plate.sql. Deletes every logged meal and custom target.
drop table if exists public.meal_logs;
drop table if exists public.plate_targets;
