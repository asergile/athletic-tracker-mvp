-- PBGB migration 05: table grants match what the app uses (Phase 5g)
-- Project: PBGB Supabase database
-- Status: APPLIED 2026-11-08 by hand in the Supabase SQL Editor. Verified afterward: grants per table match
--   the list below, anon has none, postgres default privileges no longer include anon or authenticated,
--   and the app's read, add, edit and delete flows plus a fresh signup work.
--
-- Row Level Security decides which rows a signed-in user can touch. Table grants decide which
-- operations a role may attempt at all. This migration sets the grants for the older public
-- tables to exactly the operations their RLS policies allow (the pattern migration 04 used for
-- seasons), so RLS is no longer the only lock:
--   - anon gets nothing: every app feature needs a signed-in user.
--   - authenticated gets only the operations its policies permit.
--   - the two audit views get no grants (the app doesn't use them).
-- Server code uses the service role and trigger functions run as their owner, so neither is
-- affected. No app behavior changes: everything revoked here was already refused by RLS.
--
-- Default privileges: tables (and sequences) created later by postgres no longer get
-- automatic grants for anon and authenticated. Every new migration must grant what the app
-- needs explicitly, e.g.:
--   grant select, insert, update, delete on public.<table> to authenticated;

begin;

revoke all on
  public.athlete_goals,
  public.audit_log,
  public.custom_workout_types,
  public.events,
  public.feedback,
  public.private_profiles,
  public.profiles,
  public.user_settings,
  public.workouts,
  public.recent_audit_activity,
  public.user_activity_summary
from anon, authenticated;

-- Own rows, full CRUD (policies: ALL, or one per command)
grant select, insert, update, delete on
  public.athlete_goals,
  public.custom_workout_types,
  public.events,
  public.user_settings,
  public.workouts
to authenticated;

-- Profiles: read, create, edit own (no delete policy)
grant select, insert, update on public.profiles to authenticated;

-- Date of birth: read own, set once (no update or delete policy)
grant select, insert on public.private_profiles to authenticated;

-- Feedback: send, and read back own (submitFeedback selects the inserted row)
grant select, insert on public.feedback to authenticated;

-- Audit log: read own (rows are written by the audit trigger as its owner)
grant select on public.audit_log to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

commit;

-- Verify (expect exactly the grants above, plus seasons: authenticated select/insert/update/delete):
--   select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
--   from information_schema.role_table_grants
--   where table_schema = 'public' and grantee in ('anon', 'authenticated')
--   group by table_name, grantee order by table_name, grantee;
--
-- Default privileges (expect anon and authenticated absent from the postgres rows for r and S):
--   select pg_get_userbyid(defaclrole) as for_role, defaclobjtype, defaclacl
--   from pg_default_acl where defaclnamespace = 'public'::regnamespace;
