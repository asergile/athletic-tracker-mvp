-- Rollback for migration 05 (table grants). Restores the earlier state: anon and authenticated
-- had all privileges on these tables and views, and postgres's default privileges granted
-- them all privileges on new tables and sequences in public.

begin;

grant all on
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
to anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated;

commit;
