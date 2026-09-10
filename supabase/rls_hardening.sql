-- ============================================================================
-- GetFitWithMohit — Row Level Security + Storage hardening
--
-- Run this ENTIRE file in the Supabase Dashboard SQL Editor, in one go.
-- It is written to be safe to re-run (drops/recreates policies and the
-- trigger), so if something goes wrong partway through you can fix the
-- issue and just run the whole file again.
--
-- WHY: every table in this database was readable by anyone with the public
-- anon key (no login required) — confirmed live: unauthenticated queries
-- returned all 29 clients' PII, all 21 medical_history rows, all 140
-- weekly_checkins, etc. This script closes that down to:
--   - the coach (identified by email, hardcoded below — there's only one)
--   - each client, for their own row only, on the tables they actually
--     read/write from the app
--
-- Before running: the app-side code changes that make this safe (fixing
-- the two Supabase client instances, and adding server-side identity
-- checks to 8 API routes that used the service-role key with zero auth)
-- must already be deployed. Otherwise real features will start failing
-- the moment this runs.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- SECTION A — clients (the root table; special-cased, no client_id column)
-- ----------------------------------------------------------------------------

-- RLS is row-level only. Without this trigger, a client with UPDATE
-- permission on their own row could — via a raw API call, not through any
-- UI in this app — change ANY column on their own row, including
-- coach_notes, risk_status, phase, or status. This trigger allows the
-- coach to change anything, but restricts a client's self-update to
-- exactly the two fields the app actually self-services today
-- (current_week, auth_user_id — see lib/supabase/queries/auth.ts).
create or replace function public.clients_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') = 'getfittwithmohit@gmail.com' then
    return new;
  end if;

  if new.full_name                is distinct from old.full_name
     or new.email                 is distinct from old.email
     or new.phone                 is distinct from old.phone
     or new.date_of_birth         is distinct from old.date_of_birth
     or new.gender                is distinct from old.gender
     or new.city                  is distinct from old.city
     or new.occupation            is distinct from old.occupation
     or new.start_date            is distinct from old.start_date
     or new.phase                 is distinct from old.phase
     or new.risk_status           is distinct from old.risk_status
     or new.client_type           is distinct from old.client_type
     or new.status                is distinct from old.status
     or new.coach_notes           is distinct from old.coach_notes
     or new.program_duration_weeks is distinct from old.program_duration_weeks
  then
    raise exception 'Only the coach can modify this field';
  end if;

  return new;
end;
$$;

drop trigger if exists clients_guard_self_update_trigger on public.clients;
create trigger clients_guard_self_update_trigger
before update on public.clients
for each row execute function public.clients_guard_self_update();

alter table public.clients enable row level security;

drop policy if exists "coach full access" on public.clients;
create policy "coach full access" on public.clients
  for all
  using (auth.jwt() ->> 'email' = 'getfittwithmohit@gmail.com')
  with check (auth.jwt() ->> 'email' = 'getfittwithmohit@gmail.com');

-- A client's own row is looked up two ways in this app: by auth_user_id
-- once linked, or by email before it's linked (see getCurrentClient()) —
-- both need to resolve for login/onboarding-linking to keep working.
drop policy if exists "client reads own row" on public.clients;
create policy "client reads own row" on public.clients
  for select
  using (
    auth_user_id = auth.uid()
    or email = auth.jwt() ->> 'email'
  );

drop policy if exists "client updates own row" on public.clients;
create policy "client updates own row" on public.clients
  for update
  using (
    auth_user_id = auth.uid()
    or email = auth.jwt() ->> 'email'
  )
  with check (
    auth_user_id = auth.uid()
    or email = auth.jwt() ->> 'email'
  );

-- Two paths create a new clients row while NOT the coach:
--   1. app/api/onboarding/route.ts — now uses the service role key, so it
--      bypasses RLS entirely and doesn't need this policy.
--   2. app/midjourney/page.tsx — an already-logged-in (non-coach) user
--      creates a "transfer client" row for someone else, from the browser
--      with their own session. This is pre-existing product behavior
--      (coach sends a private link; not something this cleanup changes),
--      so any authenticated user may INSERT.
drop policy if exists "authenticated users can create a client record" on public.clients;
create policy "authenticated users can create a client record" on public.clients
  for insert
  with check (auth.role() = 'authenticated');


-- ----------------------------------------------------------------------------
-- SECTION B — coach full access, every other real table
-- (milestones has no reader/writer anywhere in this codebase — locked down
-- the same way as a precaution; confirm nothing outside this repo needs it)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  coach_email text := 'getfittwithmohit@gmail.com';
begin
  foreach t in array array[
    'medical_history','fitness_background','lifestyle','nutrition',
    'psychology','expectations','hormonal_health',
    'assessments','weekly_checkins','commitment_pledges','identity_cards',
    'codex_data','daily_rituals','ritual_streaks','goal_cards','daily_goals',
    'affirmations','body_metrics','progress_photos','blood_work',
    'retention_alerts','review_calls','milestones'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "coach full access" on public.%I;', t);
    execute format(
      'create policy "coach full access" on public.%I for all using (auth.jwt() ->> ''email'' = %L) with check (auth.jwt() ->> ''email'' = %L);',
      t, coach_email, coach_email
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- SECTION C — client SELECT on their own row, for tables the client-facing
-- app actually reads back (home, progress, report, ritual, codex pages)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'assessments','weekly_checkins','commitment_pledges','identity_cards',
    'codex_data','daily_rituals','ritual_streaks','goal_cards','daily_goals',
    'affirmations','body_metrics','progress_photos','blood_work'
  ] loop
    execute format('drop policy if exists "client reads own rows" on public.%I;', t);
    execute format(
      'create policy "client reads own rows" on public.%I for select using (client_id in (select id from public.clients where auth_user_id = auth.uid()));',
      t
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- SECTION D — client INSERT on their own row, for tables the client-facing
-- app writes to directly from the browser (not via a service-role route)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'assessments','weekly_checkins','commitment_pledges','identity_cards',
    'codex_data','goal_cards','daily_goals','affirmations','body_metrics',
    'progress_photos','blood_work'
  ] loop
    execute format('drop policy if exists "client inserts own rows" on public.%I;', t);
    execute format(
      'create policy "client inserts own rows" on public.%I for insert with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));',
      t
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- SECTION E — client UPDATE on their own row, only the tables the app
-- upserts into directly (codex story/deep-identity forms, goal card, the
-- 20-goals step, recorded affirmation audio)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['codex_data','goal_cards','daily_goals','affirmations'] loop
    execute format('drop policy if exists "client updates own rows" on public.%I;', t);
    execute format(
      'create policy "client updates own rows" on public.%I for update using (client_id in (select id from public.clients where auth_user_id = auth.uid())) with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));',
      t
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- SECTION F — Storage
--
-- blood-work and progress-photos are currently PUBLIC buckets, meaning any
-- file in them is servable to anyone with the file path, with NO policy
-- check at all — independent of anything above. Paths are `${clientId}/...`
-- (see lib/utils/upload.ts), and clientId is readable by anyone today via
-- the open `clients` table, which is exactly the exposure path.
--
-- `audio` bucket is left public — it holds one shared static asset (the
-- Strangest Secret recording), not client data.
-- `affirmations` bucket is already private; it just needs policies below.
-- ----------------------------------------------------------------------------

update storage.buckets set public = false where id in ('blood-work', 'progress-photos');

do $$
declare
  b text;
  coach_email text := 'getfittwithmohit@gmail.com';
begin
  foreach b in array array['blood-work', 'progress-photos', 'affirmations'] loop
    execute format('drop policy if exists "coach full access %s" on storage.objects;', b);
    execute format(
      'create policy "coach full access %s" on storage.objects for all using (bucket_id = %L and auth.jwt() ->> ''email'' = %L) with check (bucket_id = %L and auth.jwt() ->> ''email'' = %L);',
      b, b, coach_email, b, coach_email
    );

    execute format('drop policy if exists "client reads own folder %s" on storage.objects;', b);
    execute format(
      'create policy "client reads own folder %s" on storage.objects for select using (bucket_id = %L and (storage.foldername(name))[1] in (select id::text from public.clients where auth_user_id = auth.uid()));',
      b, b
    );

    execute format('drop policy if exists "client uploads to own folder %s" on storage.objects;', b);
    execute format(
      'create policy "client uploads to own folder %s" on storage.objects for insert with check (bucket_id = %L and (storage.foldername(name))[1] in (select id::text from public.clients where auth_user_id = auth.uid()));',
      b, b
    );
  end loop;
end $$;

-- ============================================================================
-- Done. Sanity check afterward: log in as the coach and click through the
-- coach dashboard; log in as a demo client (Priya Sharma / Arjun Verma) and
-- click through onboarding-complete flows (check-in, ritual, codex) before
-- trusting this against real client accounts.
-- ============================================================================
