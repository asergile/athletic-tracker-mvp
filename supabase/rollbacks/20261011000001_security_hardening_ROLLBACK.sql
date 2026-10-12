-- ROLLBACK for 01_security_hardening.sql
-- Restores grants, security mode, search_path, and get_banking_progress exactly as they were
-- on 2026-10-11 before the migration. Only run if 01 breaks something.

begin;

-- Grants were: PUBLIC, postgres, anon, authenticated, service_role = EXECUTE on every function.
grant execute on function public.detect_suspicious_activity() to public, anon, authenticated;
grant execute on function public.cleanup_old_audit_logs() to public, anon, authenticated;
grant execute on function public.get_record_audit_history(text, uuid) to public, anon, authenticated;
grant execute on function public.handle_new_user() to public, anon, authenticated;
grant execute on function public.handle_new_user_profile() to public, anon, authenticated;
grant execute on function public.log_table_changes() to public, anon, authenticated;
grant execute on function public.get_user_workout_types(uuid) to public, anon, authenticated;
grant execute on function public.get_user_distance_unit(uuid, text) to public, anon, authenticated;

alter function public.get_user_workout_types(uuid) security definer;
alter function public.get_user_distance_unit(uuid, text) security definer;

alter function public.calculate_target_workouts(date, integer) reset search_path;
alter function public.cleanup_old_audit_logs() reset search_path;
alter function public.detect_suspicious_activity() reset search_path;
alter function public.get_record_audit_history(text, uuid) reset search_path;
alter function public.get_user_distance_unit(uuid, text) reset search_path;
alter function public.get_user_workout_types(uuid) reset search_path;
alter function public.handle_new_user() reset search_path;
alter function public.handle_new_user_profile() reset search_path;
alter function public.log_table_changes() reset search_path;
alter function public.update_updated_at_column() reset search_path;

grant execute on function public.get_banking_progress(uuid, uuid) to public, anon, authenticated;
alter function public.get_banking_progress(uuid, uuid) reset search_path;

commit;
