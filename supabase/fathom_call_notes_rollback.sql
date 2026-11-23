-- Undo supabase/fathom_call_notes.sql. Deletes all call-note drafts (the
-- saved call notes in review_calls are kept).
drop table if exists public.call_note_drafts;
alter table public.review_calls drop column if exists share_focus;
