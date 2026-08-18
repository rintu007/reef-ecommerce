# ⚠️ Test/dummy data — remove before going live

This file tracks everything added purely for development/QA testing so it can
be cleanly removed before a real launch. Nothing here is wired into the app's
normal code paths — it's all data sitting in the live Supabase project plus
one manually-run script.

## 1. Dummy seller account + listings

Created by `scripts/seed-dummy-data.mjs` (safe to re-run — skips anything
that already exists, never wired into `package.json` scripts on purpose).

- **Seller login**: `dummy-seller@reefmarket.test` / `TestSeller123!`
- **5 test listings** (titles all end with "Test listing — dummy data." in
  their description, and use stock Unsplash/base44 CDN photos — easy to
  find and delete):
  - Frogspawn Coral Frag — Green ($45)
  - Ocellaris Clownfish — Captive Bred Pair ($65)
  - German Blue Ram Cichlid — Trio ($38)
  - Protein Skimmer — 100 Gal Rated (Used, Great Condition) ($89.99)
  - Amazon Sword Plant Bundle (5 stems) ($15)

**To remove before launch:**
```sql
delete from listings where seller_id = (select id from profiles where email = 'dummy-seller@reefmarket.test');
delete from auth.users where email = 'dummy-seller@reefmarket.test'; -- cascades to profiles
```
Then delete `scripts/seed-dummy-data.mjs` and this file.

## 2. Stripe — test mode keys (live in Vercel + EAS env, and both `.env.local` files)

- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — **test mode** keys (`sk_test_.../pk_test_...`), from the Stripe account's own test dashboard. Not secrets that need scrubbing from Stripe's side (test keys can't move real money), but should be swapped for live-mode keys before launch.
- A webhook endpoint was created via the Stripe API pointing at `https://web-iota-seven-95.vercel.app/api/webhooks/stripe` (id `we_1U5ViFEWbFKkdgwSDOR7agp6`). Before launch: delete this test-mode webhook and create a fresh one against live mode + the real production domain.

### ⚠️ Known gap: Stripe Connect isn't enabled on this account yet
Checkout ultimately requires the **seller** to have a connected, `payouts_enabled` Stripe account (`transfer_data.destination` in `apps/web/src/lib/server/orders.ts`). This Stripe account hasn't signed up for Connect at all yet (`dashboard.stripe.com/connect` — one-time, dashboard-only step, can't be done via API). Until that's done:
- ✅ Browsing, cart, add-to-cart, seller pages, messages — all fully testable now with the dummy listings above.
- ❌ Completing an actual payment will fail with a "seller hasn't set up payouts" error — this is the *real* production error state, not a crash, but it means full end-to-end checkout isn't testable yet.

**Once Connect is enabled**, tell the assistant and it can finish provisioning a fully-verified test Connect account for `dummy-seller@reefmarket.test` (using Stripe's official instant-test-verification values, entirely via API, no real business/bank info) so checkout works end-to-end.

## 3. Test card numbers (once Connect is set up)
Standard Stripe test cards work once the above is resolved — e.g. `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.
