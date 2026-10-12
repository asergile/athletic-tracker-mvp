-- ROLLBACK for 20261012000001_phase1_identity.sql. Only run if it breaks something.
-- Destroys any usernames and birthdates saved since it was applied.
begin;
drop function if exists public.username_available(text);
drop function if exists private.is_minor(uuid);
drop schema if exists private;
drop table if exists public.private_profiles;
drop function if exists public.enforce_min_age();
drop trigger if exists profiles_username_change_limit on public.profiles;
drop function if exists public.enforce_username_change_limit();
alter table public.profiles drop constraint if exists profiles_username_not_reserved,
  drop constraint if exists profiles_username_format, drop constraint if exists profiles_username_key;
alter table public.profiles drop column if exists username_changed_at, drop column if exists username;
-- handle_new_user_profile: restore the 01-era version (email prefix default) only if needed.
commit;
