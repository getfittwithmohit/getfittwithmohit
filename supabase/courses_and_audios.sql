-- ============================================================================
-- GetFittWithMohit — Courses + Audio Library
--
-- Run this ENTIRE file in the Supabase Dashboard SQL Editor, in one go.
-- Safe to re-run: tables use "if not exists", policies are dropped and
-- recreated, buckets use "on conflict do nothing".
--
-- Creates only NEW tables and buckets. The only existing objects it reads are
-- public.clients (id, auth_user_id, status) — the same columns
-- supabase/rls_hardening.sql already relies on.
--
-- Access model:
--   - Coach (identified by email, same as rls_hardening.sql): full access.
--   - Any ACTIVE client (clients.status is 'active' or not set): can read
--     everything that is published. Paused / inactive clients see nothing.
--   - Each client can read and write only their own progress rows.
--
-- To undo: run supabase/courses_and_audios_rollback.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION A — helper functions
-- security definer so policies on the content tables can check the caller
-- against public.clients without depending on that table's own RLS.
-- ----------------------------------------------------------------------------

create or replace function public.gfm_is_active_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients
    where auth_user_id = auth.uid()
      and coalesce(status, 'active') = 'active'
  );
$$;

create or replace function public.gfm_is_coach()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') = 'getfittwithmohit@gmail.com';
$$;


-- ----------------------------------------------------------------------------
-- SECTION B — tables
-- ----------------------------------------------------------------------------

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  title             text not null,
  description       text,
  video_url         text,             -- YouTube or Vimeo link
  duration_minutes  integer,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists course_lessons_course_id_idx on public.course_lessons(course_id);

-- Supporting documents attached to a lesson (files live in the
-- 'course-docs' storage bucket; file_path is the path inside that bucket).
create table if not exists public.lesson_documents (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.course_lessons(id) on delete cascade,
  title       text not null,
  file_path   text not null,
  created_at  timestamptz not null default now()
);
create index if not exists lesson_documents_lesson_id_idx on public.lesson_documents(lesson_id);

-- One row per (client, lesson) once the client marks the lesson complete.
create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  lesson_id     uuid not null references public.course_lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (client_id, lesson_id)
);

-- Audio library. Files live in the 'audio-library' storage bucket.
-- collection + sort_order let one audiobook be split into ordered chapters.
create table if not exists public.audios (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  category          text not null default 'Audiobook'
                    check (category in ('Audiobook', 'Mindset Talk', 'Meditation', 'Visualisation')),
  collection        text,             -- e.g. the audiobook title; null for standalone audios
  sort_order        integer not null default 0,
  file_path         text not null,
  duration_seconds  integer,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Where each client is up to in each audio (for resume + "finished" ticks).
create table if not exists public.audio_progress (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  audio_id          uuid not null references public.audios(id) on delete cascade,
  position_seconds  integer not null default 0,
  completed         boolean not null default false,
  updated_at        timestamptz not null default now(),
  unique (client_id, audio_id)
);


-- ----------------------------------------------------------------------------
-- SECTION C — row level security
-- ----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'courses','course_lessons','lesson_documents','lesson_progress',
    'audios','audio_progress'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "coach full access" on public.%I;', t);
    execute format(
      'create policy "coach full access" on public.%I for all using (public.gfm_is_coach()) with check (public.gfm_is_coach());',
      t
    );
  end loop;
end $$;

-- Published content, readable by any active client
drop policy if exists "active clients read published courses" on public.courses;
create policy "active clients read published courses" on public.courses
  for select
  using (is_published and public.gfm_is_active_client());

drop policy if exists "active clients read lessons of published courses" on public.course_lessons;
create policy "active clients read lessons of published courses" on public.course_lessons
  for select
  using (
    public.gfm_is_active_client()
    and exists (
      select 1 from public.courses c
      where c.id = course_lessons.course_id and c.is_published
    )
  );

drop policy if exists "active clients read documents of published courses" on public.lesson_documents;
create policy "active clients read documents of published courses" on public.lesson_documents
  for select
  using (
    public.gfm_is_active_client()
    and exists (
      select 1
      from public.course_lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_documents.lesson_id and c.is_published
    )
  );

drop policy if exists "active clients read published audios" on public.audios;
create policy "active clients read published audios" on public.audios
  for select
  using (is_published and public.gfm_is_active_client());

-- Progress tables: a client reads / writes only their own rows
do $$
declare
  t text;
  own text := 'client_id in (select id from public.clients where auth_user_id = auth.uid())';
begin
  foreach t in array array['lesson_progress','audio_progress'] loop
    execute format('drop policy if exists "client reads own rows" on public.%I;', t);
    execute format('create policy "client reads own rows" on public.%I for select using (%s);', t, own);

    execute format('drop policy if exists "client inserts own rows" on public.%I;', t);
    execute format('create policy "client inserts own rows" on public.%I for insert with check (%s);', t, own);

    execute format('drop policy if exists "client updates own rows" on public.%I;', t);
    execute format('create policy "client updates own rows" on public.%I for update using (%s) with check (%s);', t, own, own);

    execute format('drop policy if exists "client deletes own rows" on public.%I;', t);
    execute format('create policy "client deletes own rows" on public.%I for delete using (%s);', t, own);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- SECTION D — storage
-- Two PRIVATE buckets. The app plays / downloads files through short-lived
-- signed links, so a file URL can't be shared outside the app for long.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('course-docs', 'course-docs', false), ('audio-library', 'audio-library', false)
on conflict (id) do nothing;

do $$
declare
  b text;
begin
  foreach b in array array['course-docs', 'audio-library'] loop
    execute format('drop policy if exists "coach full access %s" on storage.objects;', b);
    execute format(
      'create policy "coach full access %s" on storage.objects for all using (bucket_id = %L and public.gfm_is_coach()) with check (bucket_id = %L and public.gfm_is_coach());',
      b, b, b
    );

    execute format('drop policy if exists "active clients read %s" on storage.objects;', b);
    execute format(
      'create policy "active clients read %s" on storage.objects for select using (bucket_id = %L and public.gfm_is_active_client());',
      b, b
    );
  end loop;
end $$;

-- ============================================================================
-- Done. Sanity check afterward:
--   1. Log in as the coach → Dashboard → "Courses & Audios" → create a course,
--      add a lesson, upload a document and an audio, publish both.
--   2. Log in as a demo client (Priya Sharma / Arjun Verma) → Home → Courses
--      and Audios → confirm they appear and play.
--   3. Unpublish one → confirm it disappears for the client.
-- ============================================================================
