-- RLS is defense-in-depth here, not the primary authorization layer: almost all
-- reads/writes go through the Next.js backend using the Supabase service-role key,
-- which bypasses RLS. The one path that genuinely depends on these policies is
-- Supabase Realtime (clients subscribe directly with their own session) — see
-- "messages"/"conversations" below. Everything else is a safety net.

alter table profiles enable row level security;
alter table listings enable row level security;
alter table services enable row level security;
alter table orders enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table watchlists enable row level security;
alter table saved_searches enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;
alter table membership_plans enable row level security;
alter table user_subscriptions enable row level security;
alter table promo_codes enable row level security;
alter table promo_code_redemptions enable row level security;
alter table user_credits enable row level security;
alter table seller_payout_accounts enable row level security;
alter table announcements enable row level security;
alter table help_content enable row level security;

-- ---------------------------------------------------------------- profiles
create policy profiles_select_all on profiles for select using (true);
create policy profiles_update_own on profiles for update using (id = auth.uid());
create policy profiles_update_admin on profiles for update using (is_admin());

-- ---------------------------------------------------------------- listings (public read, base44 rls:{read:true})
create policy listings_select_public on listings for select using (status = 'active' or seller_id = auth.uid() or is_admin());
create policy listings_insert_own on listings for insert with check (seller_id = auth.uid());
create policy listings_update_own_or_admin on listings for update using (seller_id = auth.uid() or is_admin());
create policy listings_delete_own_or_admin on listings for delete using (seller_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------- services (public read, base44 rls:{read:true})
create policy services_select_public on services for select using (status = 'active' or provider_id = auth.uid() or is_admin());
create policy services_insert_own on services for insert with check (provider_id = auth.uid());
create policy services_update_own_or_admin on services for update using (provider_id = auth.uid() or is_admin());
create policy services_delete_own_or_admin on services for delete using (provider_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------- orders (buyer/seller/admin only)
create policy orders_select_participant on orders for select using (
  buyer_id = auth.uid() or seller_id = auth.uid() or is_admin()
);

-- ---------------------------------------------------------------- conversations / messages (Realtime relies on these)
create policy conversations_select_participant on conversations for select using (
  user_a_id = auth.uid() or user_b_id = auth.uid() or is_admin()
);
create policy messages_select_participant on messages for select using (
  is_admin() or exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);

-- ---------------------------------------------------------------- reviews (public read, owner write)
create policy reviews_select_all on reviews for select using (true);
create policy reviews_insert_own on reviews for insert with check (reviewer_id = auth.uid());

-- ---------------------------------------------------------------- watchlists / saved_searches (owner only)
create policy watchlists_owner_all on watchlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_searches_owner_all on saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- reports / blocked_users
create policy reports_select_own_or_admin on reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_insert_own on reports for insert with check (reporter_id = auth.uid());
create policy reports_update_admin on reports for update using (is_admin());
create policy blocked_users_owner_all on blocked_users for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------- plans (public read)
create policy membership_plans_select_all on membership_plans for select using (true);

-- ---------------------------------------------------------------- subscriptions / promo / credits / payouts (owner or admin)
create policy user_subscriptions_select_own_or_admin on user_subscriptions for select using (user_id = auth.uid() or is_admin());
create policy promo_codes_select_admin on promo_codes for select using (is_admin());
create policy promo_code_redemptions_select_own_or_admin on promo_code_redemptions for select using (user_id = auth.uid() or is_admin());
create policy user_credits_select_own_or_admin on user_credits for select using (user_id = auth.uid() or is_admin());
create policy seller_payout_accounts_select_own_or_admin on seller_payout_accounts for select using (user_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------- content (public read when published, base44 rls:{read:true})
create policy announcements_select_active on announcements for select using (is_active or is_admin());
create policy help_content_select_published on help_content for select using (published or is_admin());
