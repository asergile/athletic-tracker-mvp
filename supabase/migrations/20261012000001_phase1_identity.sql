-- PBGB migration 02: Phase 1 identity (PRD R1 username/display name, R2 age gate)
-- Project: PBGB production Supabase database
-- Status: APPLIED 2026-10-12 (migration phase1_identity). Verified in a rolled-back transaction:
--   signup, username rules, 30-day change limit, under-13 rejection, DOB immutability,
--   owner-only DOB reads, anon blocked from username_available.

begin;

create extension if not exists citext with schema extensions;

-------------------------------------------------------------------------------
-- R1. Username on profiles
-------------------------------------------------------------------------------
alter table public.profiles
  add column username extensions.citext,
  add column username_changed_at timestamptz;

alter table public.profiles
  add constraint profiles_username_key unique (username),
  add constraint profiles_username_format
    check (username is null or username::text ~ '^[A-Za-z0-9_]{3,20}$'),
  add constraint profiles_username_not_reserved
    check (username is null or lower(username::text) not in (
      'admin','administrator','root','support','help','coach','coaches','parent','parents',
      'pbgb','goalbuddy','goal_buddy','personalbest','api','app','www','mail','email',
      'system','null','undefined','settings','login','signup','invite','invites','team',
      'teams','official','staff','moderator','security','privacy','terms','safesport'));

-- Username can change at most once every 30 days (first set is free).
create or replace function public.enforce_username_change_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.username is distinct from old.username then
    if old.username is not null
       and old.username_changed_at is not null
       and old.username_changed_at > now() - interval '30 days' then
      raise exception 'Username can only be changed once every 30 days'
        using errcode = 'check_violation';
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_username_change_limit
  before update of username on public.profiles
  for each row execute function public.enforce_username_change_limit();

revoke execute on function public.enforce_username_change_limit() from public, anon, authenticated;

-- New users: stop defaulting display_name to the email prefix (it leaks the email once profiles
-- are shared). Use the provider's full name if there is one; otherwise leave it empty for onboarding.
-- NOTE: still writes email for now; migration 03 removes it after the app stops reading it.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  );
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- R2. Date of birth, private, 13+ only
-------------------------------------------------------------------------------
create table public.private_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date not null,
  created_at    timestamptz not null default now()
);

comment on table public.private_profiles is
  'Private per-user data (date of birth). Owner-only. Never join into shared views.';

alter table public.private_profiles enable row level security;

create policy "Owner can read own private profile"
  on public.private_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Owner can set own date of birth once"
  on public.private_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);
-- No update/delete policies: a DOB correction goes through support (service role).

create or replace function public.enforce_min_age()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.date_of_birth > current_date then
    raise exception 'Date of birth is in the future' using errcode = 'check_violation';
  end if;
  if new.date_of_birth < date '1900-01-01' then
    raise exception 'Date of birth is not valid' using errcode = 'check_violation';
  end if;
  if new.date_of_birth > (current_date - interval '13 years')::date then
    raise exception 'under_13' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger private_profiles_min_age
  before insert or update on public.private_profiles
  for each row execute function public.enforce_min_age();

revoke execute on function public.enforce_min_age() from public, anon, authenticated;

-- is_minor() lives in a schema the REST API does not expose, so it can be used inside
-- RLS policies (Phases 2-3) without letting anyone probe other users' ages.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_minor(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select date_of_birth > (current_date - interval '18 years')::date
  from public.private_profiles
  where user_id = p_user;
$$;

revoke execute on function private.is_minor(uuid) from public, anon;
grant execute on function private.is_minor(uuid) to authenticated;

-------------------------------------------------------------------------------
-- Username availability check for the UI (added when applied).
-- SECURITY DEFINER on purpose: it must see other users' usernames, but returns only a boolean.
-------------------------------------------------------------------------------
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
    and lower(p_username) not in (
      'admin','administrator','root','support','help','coach','coaches','parent','parents',
      'pbgb','goalbuddy','goal_buddy','personalbest','api','app','www','mail','email',
      'system','null','undefined','settings','login','signup','invite','invites','team',
      'teams','official','staff','moderator','security','privacy','terms','safesport')
    and not exists (
      select 1 from public.profiles
      where lower(username::text) = lower(p_username) and id <> auth.uid());
$$;
revoke execute on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;

commit;

-- App work that goes with this migration (not SQL):
--   * Onboarding + one-time backfill screen: shown when profiles.username is null
--     OR there is no private_profiles row. Collect username, display name, DOB.
--     Do NOT pre-fill display_name when it equals the email prefix (most existing users).
--   * Neutral DOB field. On 'under_13' error: block screen, set a device flag
--     (cookie + localStorage), sign out, and delete the auth user from a server route
--     using the service role key.
--   * Username availability check: query profiles by username (needs a narrow SELECT path;
--     simplest is a SECURITY DEFINER rpc username_available(text) returning boolean only).
