-- ============================================================================
-- GetFittWithMohit — Courses + Audio Library — ROLLBACK
--
-- Undoes supabase/courses_and_audios.sql. THIS DELETES ALL COURSE, LESSON,
-- AUDIO AND PROGRESS ROWS. It does not touch any pre-existing table.
--
-- Uploaded files are NOT removed by this script (Supabase blocks deleting
-- storage objects via SQL). Empty and delete the 'course-docs' and
-- 'audio-library' buckets from Dashboard → Storage if you want them gone.
-- ============================================================================

drop policy if exists "coach full access course-docs" on storage.objects;
drop policy if exists "active clients read course-docs" on storage.objects;
drop policy if exists "coach full access audio-library" on storage.objects;
drop policy if exists "active clients read audio-library" on storage.objects;

drop table if exists public.audio_progress;
drop table if exists public.lesson_progress;
drop table if exists public.lesson_documents;
drop table if exists public.course_lessons;
drop table if exists public.audios;
drop table if exists public.courses;

drop function if exists public.gfm_is_active_client();
drop function if exists public.gfm_is_coach();
