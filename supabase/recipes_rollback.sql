-- Undo supabase/recipes.sql (deletes every recipe, vote and setting).
drop table if exists public.recipe_feedback;
drop table if exists public.recipe_settings;
drop table if exists public.recipes;
