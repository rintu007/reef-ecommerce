-- profiles.id references auth.users on delete cascade, so deleting the auth user
-- removes the profile — but not the other way round. Deleting a profiles row
-- directly (e.g. from the Supabase table editor) left the auth.users row behind,
-- so the email stayed "already registered" and the account could never sign up
-- again. Make a profile delete also remove its auth user.

create or replace function handle_profile_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- When the delete started from auth.users, that row is already gone and this
  -- is a no-op, so the cascade doesn't loop.
  delete from auth.users where id = old.id;
  return old;
end;
$$;

create trigger on_profile_deleted
  after delete on profiles
  for each row execute function handle_profile_deleted();

-- Clean up auth users whose profile was already deleted before this trigger existed.
delete from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
