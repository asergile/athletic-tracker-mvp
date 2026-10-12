-- PBGB migration 01: security hardening (fix existing issues before Phase 1)
-- Project: PBGB production Supabase database
-- Status: APPLIED 2026-10-11 (as migrations security_hardening_grants,
--   pin_search_path_update_updated_at, lock_down_get_banking_progress).
-- Verified: no live app code calls these functions via .rpc(); signup triggers and the
--   workout audit trigger still fire (tested in a rolled-back transaction).

begin;

-- 1. Admin-only functions: nobody outside the server should call these.
--    detect_suspicious_activity currently returns user emails to anyone, signed in or not.
--    cleanup_old_audit_logs lets anyone delete audit history.
--    get_record_audit_history returns full old/new row values (incl. voice transcriptions) for any record id.
revoke execute on function public.detect_suspicious_activity() from public, anon, authenticated;
revoke execute on function public.cleanup_old_audit_logs() from public, anon, authenticated;
revoke execute on function public.get_record_audit_history(text, uuid) from public, anon, authenticated;

-- 2. Trigger functions: only fired by triggers, never called directly.
--    (Triggers keep working; EXECUTE is checked when the trigger is created, not when it fires.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;
revoke execute on function public.log_table_changes() from public, anon, authenticated;
-- Belt and braces: the auth service inserts into auth.users, which fires the two signup triggers.
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.handle_new_user_profile() to supabase_auth_admin;

-- 3. Per-user lookups: run as the caller so RLS limits them to the caller's own rows.
alter function public.get_user_workout_types(uuid) security invoker;
alter function public.get_user_distance_unit(uuid, text) security invoker;
revoke execute on function public.get_user_workout_types(uuid) from public, anon;
revoke execute on function public.get_user_distance_unit(uuid, text) from public, anon;
grant execute on function public.get_user_workout_types(uuid) to authenticated;
grant execute on function public.get_user_distance_unit(uuid, text) to authenticated;

-- 4. get_banking_progress is broken (references athlete_goals.athlete_id, which doesn't exist)
--    and unused by the app. Locked down rather than dropped; drop it in a later cleanup.
revoke execute on function public.get_banking_progress(uuid, uuid) from public, anon, authenticated;
alter function public.get_banking_progress(uuid, uuid) set search_path = public, pg_temp;

-- 5. Pin search_path on every remaining function (Supabase linter warning 0011).
alter function public.calculate_target_workouts(date, integer) set search_path = public, pg_temp;
alter function public.cleanup_old_audit_logs() set search_path = public, pg_temp;
alter function public.detect_suspicious_activity() set search_path = public, pg_temp;
alter function public.get_record_audit_history(text, uuid) set search_path = public, pg_temp;
alter function public.get_user_distance_unit(uuid, text) set search_path = public, pg_temp;
alter function public.get_user_workout_types(uuid) set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.handle_new_user_profile() set search_path = public, pg_temp;
alter function public.log_table_changes() set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;

commit;

-- Not SQL (do in the Supabase dashboard):
--   * Auth > Settings: turn on leaked password protection.
--   * Settings > Infrastructure: upgrade Postgres (17.4.1.054 has security patches pending).
--   * Audit log retention: cleanup_old_audit_logs is never scheduled (oldest row is Sept 2025).
--     Either schedule it with pg_cron (as postgres) or decide on a longer retention.
