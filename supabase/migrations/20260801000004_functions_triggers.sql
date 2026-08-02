-- ============================================================== updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger listings_set_updated_at before update on listings
  for each row execute function set_updated_at();
create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger saved_searches_set_updated_at before update on saved_searches
  for each row execute function set_updated_at();
create trigger reports_set_updated_at before update on reports
  for each row execute function set_updated_at();
create trigger membership_plans_set_updated_at before update on membership_plans
  for each row execute function set_updated_at();
create trigger user_subscriptions_set_updated_at before update on user_subscriptions
  for each row execute function set_updated_at();
create trigger promo_codes_set_updated_at before update on promo_codes
  for each row execute function set_updated_at();
create trigger user_credits_set_updated_at before update on user_credits
  for each row execute function set_updated_at();
create trigger seller_payout_accounts_set_updated_at before update on seller_payout_accounts
  for each row execute function set_updated_at();
create trigger announcements_set_updated_at before update on announcements
  for each row execute function set_updated_at();
create trigger help_content_set_updated_at before update on help_content
  for each row execute function set_updated_at();

-- ============================================================== profile bootstrap
-- Auto-create a profiles row whenever a new auth.users row appears (sign-up).
-- display_name/avatar fall back to whatever the auth provider handed us (e.g. OAuth).
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Keep profiles.email in sync if a user changes their auth email.
create or replace function handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function handle_auth_user_email_change();

-- ============================================================== authorization helper
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================== conversation bookkeeping
create or replace function touch_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on messages
  for each row execute function touch_conversation_last_message();
