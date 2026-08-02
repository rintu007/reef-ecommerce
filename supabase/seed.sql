-- Local/dev seed data. Values below are copied from the real production export
-- (db/MembershipPlan_export.csv) so local dev matches live plan pricing —
-- NOT placeholders. Re-verify against the live Base44 app before go-live in
-- case pricing changed after the export was taken (2026-07-28).

insert into membership_plans (slug, name, price_monthly, max_active_listings, description, features, is_active)
values
  ('free', 'Free', 0, 5, 'Perfect for casual sellers',
    array['Up to 5 active listings', 'Basic listing details', 'Message buyers'], true),
  ('pro', 'Hobbyist Premium', 9.99, -1, 'For serious hobbyists',
    array['Unlimited active listings', 'Priority in search results', 'Message buyers', 'Shipping labels (coming soon)'], true),
  ('business', 'Business', 24.99, -1, 'For stores and large sellers',
    array['Unlimited active listings', 'Top search placement', 'Verified seller badge', 'Bulk listing tools (coming soon)', 'Dedicated support'], true)
on conflict (slug) do update set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  max_active_listings = excluded.max_active_listings,
  description = excluded.description,
  features = excluded.features;
