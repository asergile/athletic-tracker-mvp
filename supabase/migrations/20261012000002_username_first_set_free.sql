-- PBGB migration: first username choice doesn't start the 30-day change clock
-- Project: PBGB production Supabase database
-- Status: APPLIED 2026-10-12. Verified: first set ok, one change ok, next change within 30 days blocked.
-- Rollback: re-run the enforce_username_change_limit() definition from 20261012000001_phase1_identity.sql.

create or replace function public.enforce_username_change_limit()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.username is distinct from old.username then
    if old.username is null then
      -- First time choosing a username: doesn't start the 30-day clock.
      new.username_changed_at := null;
    elsif old.username_changed_at is not null
       and old.username_changed_at > now() - interval '30 days' then
      raise exception 'username_change_limit' using errcode = 'check_violation';
    else
      new.username_changed_at := now();
    end if;
  end if;
  return new;
end; $$;
