-- PBGB migration 04: seasons (Activity Grid Phase 4a)
-- Project: PBGB Supabase database
-- Status: APPLIED 2026-11-07 by hand in the Supabase SQL Editor. Verified afterward: RLS on, 4 owner-only
--   policies, check constraints present, only authenticated has select/insert/update/delete, Security Advisor clean.
--
-- A season is a user-named date range with a required start and end: a sport's season,
-- a training block, any span. It is a lens for Trends: every workout dated inside it
-- counts. Workouts are NOT linked to seasons, so editing or deleting a season never
-- touches workouts. Overlaps and duplicate names are allowed (decided 11/04/26).
-- v1 has no repeat, no link between seasons and no season-to-season comparison.

begin;

create table public.seasons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  constraint seasons_name_length check (char_length(btrim(name)) between 1 and 50),
  constraint seasons_end_after_start check (end_date >= start_date),
  -- About 2 years at most (catches typos like 2062 for 2026).
  constraint seasons_max_length check (end_date - start_date <= 731)
);

comment on table public.seasons is
  'User-defined named date ranges (seasons, training blocks). Lens only: workouts are not linked.';

create index seasons_user_start_idx on public.seasons (user_id, start_date desc);

alter table public.seasons enable row level security;

-- Supabase's default privileges grant ALL (incl. TRUNCATE, which ignores RLS) to anon and
-- authenticated on new public tables. Keep only what the app needs.
revoke all on public.seasons from anon, authenticated;
grant select, insert, update, delete on public.seasons to authenticated;

create policy "Users can view own seasons"
  on public.seasons for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own seasons"
  on public.seasons for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own seasons"
  on public.seasons for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own seasons"
  on public.seasons for delete
  to authenticated
  using ((select auth.uid()) = user_id);

commit;

-- Checks to run after applying (read-only):
--   select relrowsecurity from pg_class where oid = 'public.seasons'::regclass;
--     -> true
--   select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'seasons' order by cmd;
--     -> 4 rows: DELETE, INSERT, SELECT, UPDATE
--   select conname from pg_constraint where conrelid = 'public.seasons'::regclass order by conname;
--     -> seasons_end_after_start, seasons_max_length, seasons_name_length, seasons_pkey, seasons_user_id_fkey
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_schema = 'public' and table_name = 'seasons' and grantee in ('anon', 'authenticated') order by 1, 2;
--     -> 4 rows, authenticated only: DELETE, INSERT, SELECT, UPDATE
--   Supabase dashboard > Advisors > Security: no new warnings for public.seasons.
