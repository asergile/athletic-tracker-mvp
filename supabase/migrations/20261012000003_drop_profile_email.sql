-- PBGB migration 03: remove email from profiles
-- Project: PBGB production Supabase database
-- Status: APPLIED 2026-10-12 by hand in the Supabase SQL Editor (destructive changes time out via the MCP tool).
-- Verified afterward: email column gone, signup creates profile + settings, users can update own profile, workouts save.
--
-- Apply ONLY after the app no longer reads profiles.email:
--   grep -rn "email" src/ app/ lib/ | grep -i profile
-- Use supabase.auth.getUser() for the signed-in user's own email instead.
-- Must ship before any sharing (Phases 2-3): RLS filters rows, not columns, so any
-- viewer who can read a profile row would see the email.

begin;

-- Both update policies reference profiles.email; replace them first.
drop policy if exists "Email is immutable" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.profiles drop column email;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'full_name'), ''));
  return new;
end;
$$;

commit;
