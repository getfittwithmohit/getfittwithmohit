-- ============================================================================
-- GetFittWithMohit — Weekly call notes from Fathom
--
-- Run this ENTIRE file in the Supabase SQL Editor, in one go. Safe to re-run.
-- Requires supabase/courses_and_audios.sql (gfm_is_coach()).
--
-- Additive only:
--   1. New table call_note_drafts — one row per recorded call (from the
--      Fathom webhook) or per pasted transcript. Holds the AI-written drafts
--      of the three call fields + the WhatsApp recap until the coach saves
--      them into review_calls. Transcripts are NEVER stored: only the drafts
--      and a link back to the Fathom recording.
--   2. review_calls.share_focus (boolean, default false). When true, the
--      client sees that call's "next focus" on their Today screen. Every
--      existing call stays private (false).
--
-- To undo: supabase/fathom_call_notes_rollback.sql
-- ============================================================================

create table if not exists public.call_note_drafts (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null default 'fathom' check (source in ('fathom', 'paste')),
  fathom_recording_id bigint unique,
  client_id           uuid references public.clients(id) on delete cascade,
  week_number         integer,
  meeting_title       text,
  meeting_at          timestamptz,
  recording_url       text,
  invitee_emails      text[] not null default '{}',
  status              text not null default 'processing'
                        check (status in ('processing', 'unmatched', 'draft', 'applied', 'dismissed', 'error')),
  discussed           text,
  changes             text,
  next_focus          text,
  whatsapp_message    text,
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists call_note_drafts_status_idx on public.call_note_drafts (status, created_at desc);
create index if not exists call_note_drafts_client_idx on public.call_note_drafts (client_id, created_at desc);

-- Coach only. The webhook writes with the service role (bypasses RLS).
alter table public.call_note_drafts enable row level security;
drop policy if exists "coach full access" on public.call_note_drafts;
create policy "coach full access" on public.call_note_drafts
  for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());

alter table public.review_calls add column if not exists share_focus boolean not null default false;

-- Check: should return 1 row for the table and 1 for the column.
select 'call_note_drafts' as created from information_schema.tables
  where table_schema = 'public' and table_name = 'call_note_drafts'
union all
select 'review_calls.share_focus' from information_schema.columns
  where table_schema = 'public' and table_name = 'review_calls' and column_name = 'share_focus';
