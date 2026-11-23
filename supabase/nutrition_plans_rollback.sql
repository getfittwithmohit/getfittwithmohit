-- Undo supabase/nutrition_plans.sql. Deletes every nutrition plan, version and
-- template. Run only if you are sure.
drop table if exists public.nutrition_plan_versions;
drop table if exists public.nutrition_plans;
