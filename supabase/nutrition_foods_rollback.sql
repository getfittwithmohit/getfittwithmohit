-- Undo supabase/nutrition_foods.sql. Deletes the food list, including foods
-- the coach added. Run only if you are sure.
drop table if exists public.foods;
