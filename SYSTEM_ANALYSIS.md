# Reef Market — Full System Analysis (pre-rebuild functional spec)

Purpose: capture **exactly what the current Base44-based system does** — data, business rules, external dependencies, and known bugs/dead code — so the rebuild (new stack, Base44 removed) can reproduce the same functionality deliberately, fixing gaps rather than accidentally dropping features. This supersedes the high-level `PROJECT_ANALYSIS.md` for anything that conflicts; this doc is the detailed reference.

---

## 1. How the frontend talks to the backend today

- Single SDK client: `src/api/base44Client.js` (`createClient` from `@base44/sdk`). Imported **directly in almost every page/component** — there is no repository/service abstraction layer to swap out.
- Every read is `base44.entities.<Entity>.filter(...)`/`.list(...)` and every write is `.create()/.update()/.delete()`, wrapped in TanStack Query (`useQuery`/`useMutation`) but with the SDK call inline in the `queryFn`/`mutationFn` — not behind a shared hook.
- Privileged/multi-step operations go through `base44.functions.invoke("<functionName>", payload)`, which calls a Deno function under `base44/functions/<name>/entry.ts`.
- Three Base44 "integration" (built-in service) calls are used directly from the frontend, in addition to entities/functions:
  - `base44.integrations.Core.UploadFile({file})` → file storage upload, used in `src/components/sell/PhotoUploader.jsx`, `src/components/profile/TankPhotos.jsx`, `src/components/profile/SellerProfileEditor.jsx`, `src/pages/Services.jsx`, `src/pages/SellerDashboard.jsx`.
  - `base44.integrations.Core.InvokeLLM(...)` → AI text generation, used twice in `src/pages/Sell.jsx` (listing title/description "AI populate" and description rewriting).
  - `base44.integrations.Core.GenerateImage({prompt, existing_image_urls})` → AI photo "enhance", used in `PhotoUploader.jsx`.
  - `base44.integrations.Core.SendEmail(...)` → used client-side in `src/pages/Support.jsx` (contact form) and `src/components/moderation/ReportBlockSheet.jsx` (report/block emails to a hardcoded admin address).
- Server-side, Base44 functions use `createClientFromRequest(req)` (auth-scoped to the calling user) or `createClientFromRequest(req, {skipAuth:true})` / `base44.asServiceRole` for privileged/automation/cron contexts (service-role, bypasses RLS and ownership checks).
- Auth session plumbing: `src/lib/app-params.js` reads `access_token` from the URL query string (Base44's redirect-based login hands back a token this way), persists it to `localStorage`, and `AuthContext` calls a raw axios request to a Base44 "public settings" endpoint plus `base44.auth.me()`/`base44.auth.logout()`/`base44.auth.redirectToLogin()`.
- Build tooling: `vite.config.js` wires in `@base44/vite-plugin` (dev HMR notifier, "visual edit agent", analytics tracker, legacy `@/integrations`/`@/entities` import shims) — this plugin and its dev-time hooks disappear entirely once off Base44.

**Implication for rebuild**: because there's no existing abstraction layer, migration is a full rewrite of every data-access call site, not a driver swap. The plan should introduce a thin shared data-access layer (hooks per entity) up front so web and the future mobile app both consume it.

---

## 2. Entities (data model) — see `base44/entities/*.jsonc` for full field lists

18 entities: `Listing`, `Service`, `Order`, `User`, `Message`, `Review`, `Watchlist`, `SavedSearch`, `Report`, `BlockedUser`, `MembershipPlan`, `UserSubscription`, `PromoCode`, `UserCredit`, `SellerPayoutAccount`, `Announcement`, `HelpContent`, `VisitorLog`. (Full property-level schema already documented in `PROJECT_ANALYSIS.md` §3 — not repeated here.) Two entities have `rls:{read:true}` (public read): `Listing`, `Service` — plus `Announcement` and effectively `HelpContent` are also publicly readable in practice.

Relational note: entities reference each other by **email string** (`seller_email`, `buyer_email`, `user_email`, `reviewer_email`, etc.) and by **loose id string** (`listing_id`, `order_id`), not real foreign keys — there is no DB-level referential integrity today. A relational rebuild should convert these to real FKs against a `profiles`/`auth.users` table and enforce integrity, while keeping denormalized snapshot fields where they exist intentionally (e.g. `Order.listing_title`/`listing_photo` are snapshots at purchase time, not live joins — preserve that behavior, don't accidentally make them live joins).

---

## 3. Flow-by-flow business logic

### 3.1 Auth & guest mode
- `AuthContext.jsx`: on load, checks app public settings, then `base44.auth.me()`. `authError.type` is one of `user_not_registered` (blocks with `UserNotRegisteredError`), `auth_required` (shows `GuestLoginScreen` — user can sign in or `continueAsGuest()`), or none (authenticated). `/support` and `/about` are reachable without auth.
- Guest mode is a **pure client-side flag** (`isGuest`) — no backend guest session; a guest checking out supplies an email manually (`CheckoutModal` "guest" branch).
- **Bug found**: `ProtectedRoute.jsx` destructures `authChecked`/`checkUserAuth` from `useAuth()`, but `AuthContext.jsx` never defines/exports either. `authChecked` is always `undefined`, and the effect calling `checkUserAuth()` will throw. This is broken in the current code — do not port as-is; the rebuild's `ProtectedRoute` should be reconciled with whatever the new `AuthContext` actually exposes.

### 3.2 Listings — browse/sell/edit
- Create/edit via `Sell.jsx`: `Listing.create({...payload, status:'active', featured:false})` or `.update(editId, payload)`. AI "populate fields" / "rewrite description" buttons call `InvokeLLM`.
- Photos: `PhotoUploader.jsx` uploads via `UploadFile` → `{file_url}`; "enhance" button calls `GenerateImage` with existing photo URLs as reference.
- Public browse reads go through the `getPublicListings` function (service-role, no auth required) rather than direct entity `.filter()` — it also handles the `market:"both"` merge (a listing tagged `"both"` should appear in both saltwater and freshwater browse views): it runs two parallel `asServiceRole.entities.Listing.filter()` calls (exact market + `market:"both"`) and dedupes/sorts by `created_date`. **This merge-by-market behavior is a rule to preserve exactly** — it's easy to lose if the rebuild naively does `WHERE market = :market`.
- Approval workflow: `status` enum includes `pending_approval` — Admin tab can flip listings active/removed; `deleteListing` function does a real delete (vs. soft-remove via status update).

### 3.3 Checkout & payments (single item)
- UI step machine in `CheckoutModal.jsx`: `agreement → options (qty/shipping method) → pickup_time (optional) → payment`.
- `createPaymentIntent` function validates: buyer ≠ seller, listing not `sold`, quantity within `min_qty`/available `quantity`, order meets `min_order_amount`; requires seller to have a `SellerPayoutAccount` with `payouts_enabled`.
- Fee model (**exact math to preserve**):
  - `itemSubtotal = price × quantity`
  - `shippingCost` = flat `shipping_cost`, or computed from `shipping_tiers` (first tier whose `up_to_qty ≥ quantity`, else last tier) — only added when `shipping_method === 'shipping'`.
  - `platformFee = 5% of itemSubtotal` (buyer-side "application fee" retained by platform via Stripe Connect).
  - `featuredFeeDeduction = $0.99` if `listing.featured_fee` is true.
  - Stripe PaymentIntent: `amount = itemSubtotal + shippingCost`, `application_fee_amount = platformFee + featuredFee`, `transfer_data.destination = seller's connected account` (money is split by Stripe at charge time — **this is a direct-charge-with-destination model, not a manual transfer for the happy path**).
  - `seller_receives` estimate for display = `itemSubtotal − platformFee − estimatedStripeFee(2.9% + $0.30) − featuredFee`. Note this estimate is **not persisted consistently** — some downstream functions read it back from `pi.metadata.seller_receives_cents`, others recompute it with slightly different constants (see §5 bugs). Sales tax is *not* computed server-side in this function (left to Stripe Tax / UI copy says "calculated at checkout" — verify actual tax handling before assuming it's implemented).
- After `stripe.confirmPayment`, the client optimistically calls `createOrderAfterPayment` (dedupes on existing `confirmed` order for same listing+buyer; decrements `Listing.quantity`, flips to `sold` at 0). `stripeWebhook`'s `payment_intent.succeeded` handler is the **authoritative fallback** doing the same create+decrement server-side (in case the client-side call fails/never fires) plus sending the seller-sale and buyer-receipt notifications.

### 3.4 Cart checkout (multi-listing, single seller)
- `CartCheckoutModal.jsx` → `createCartPaymentIntent` (max 20 items, all one seller, seller ≠ buyer, none sold, seller payouts enabled) → single PaymentIntent, `platformFee = 5%` of items total, no shipping/tax modeled. `createCartOrders` creates one `Order` per listing (forces `sales_tax:0, buyer_service_fee:0`), same dedupe/decrement pattern as single-item.

### 3.5 Order lifecycle / fulfillment
Two parallel completion paths depending on `shipping_method`:

**Shipping path**: `confirmed → shipped (seller adds tracking) → delivered (17Track detects delivery, via checkTrackingStatus cron ~2h) → completed`. Buyer can also self-serve "Confirm Receipt" (`releasePaymentToSeller`) any time status is `confirmed|shipped|delivered`, which also works even without tracking data.
**Special case — verified coral sellers**: in `addTrackingNumber`, if `listing_type==='coral'` **and** `seller.verified_seller===true`, tracking upload triggers **immediate** completion + payout release (skips the shipped/delivered wait) — this is a real trust perk, not a UI-only badge; preserve exactly.

**Local pickup path**: `confirmed → awaiting_pickup (seller marks picked up) → completed (buyer confirms)`, with a **dispute branch** (`buyer_deny_pickup` reverts to `confirmed` and logs a note/emails both parties, no transfer happens) and an **auto-release safety net**: `checkPendingPickups` (hourly cron) auto-completes + pays out any pickup marked by seller but not confirmed by buyer after **72 hours** (`HOURS_UNTIL_AUTO_RELEASE`).

**Payout mechanics**: the normal checkout already routes money to the seller via Stripe Connect `transfer_data.destination` at charge time. The *explicit* `stripe.transfers.create` calls seen in `addTrackingNumber`, `checkTrackingStatus`, `confirmLocalPickup` appear to be a **second/idempotent transfer step** guarded by checking existing transfers via `transfer_group`/`metadata.order_id` — worth clarifying with a Stripe Connect specialist during rebuild whether this double-transfer pattern is intentional (e.g. destination charge was for a different amount and this reconciles a shortfall) or a historical artifact; recommend simplifying to one clear payout model in the rebuild rather than reproducing ambiguity.

**Verified seller status**: `checkAndGrantVerifiedSeller` (called after every completed order) counts `Order{status:'completed'}` per seller, updates `completed_sales_count`, and grants `verified_seller=true` at **10** completed sales (with a congrats email) — one-way, never revoked in current code.

**Cancellation**: `cancelOrder` — buyer-only, only from `status:'pending'` → `cancelled` (no Stripe refund triggered here, because at `pending` no payment has succeeded yet). `deleteOrder` — hard-deletes only `cancelled` orders (buyer or admin).

**DOA / disputes**: `processRefundOrCredit` (**admin-only**) — computes `refundableAmount = orderTotal − nonRefundablePlatformFee(5%)`; `store_credit` action creates a `UserCredit` row and sets `status:'doa_claim'`; `refund` action **only sets status — it does not call any Stripe refund API** (explicit TODO comment in source: "Trigger the actual refund via your payment provider"). **This is an unimplemented gap in the current system, not a working feature** — the rebuild should either implement a real Stripe refund call or explicitly flag this as manual-admin-process, but should not assume "refund" currently works end-to-end.

### 3.6 Subscriptions / membership plans / listing limits
- `getPlans` returns active `MembershipPlan`s, or hardcoded free/pro/business defaults if the table is empty.
- `getSubscription` resolves the user's active/trialing plan (defaulting to `free`), counts the user's active listings, and computes `usage.can_create_listing = maxListings===-1 || activeCount<maxListings`.
- **Bug/inconsistency**: `checkListingLimit` (a separate function, presumably called from the Sell flow before allowing a new listing) **unconditionally returns `allowed:true`** regardless of plan or usage — i.e., listing-limit enforcement is currently a no-op in practice, contradicting the `can_create_listing` value `getSubscription` computes. Decide during rebuild whether real enforcement is desired (likely yes, since plans exist specifically to gate this) or whether "unlimited for everyone" is the actual current intended behavior — this needs a product decision, not a silent fix.
- `updateSubscription` / `cancelStripeSubscription` / `processSubscriptionRenewals` (cron) manage the `UserSubscription` state machine (`active/cancelled/past_due/trialing`), including a manual-payment grace-period path distinct from Stripe-webhook-driven subscriptions.
- Separate, hardcoded **$9.99/mo "Hobbyist Premium"** Stripe Checkout subscription flow exists (`createStripeCheckout`) alongside the plan-based system — clarify with the user whether this is a legacy/parallel monetization path still in use or dead code before deciding whether to port it.

### 3.7 Promo codes
- `applyPromoCode`: case-insensitive code lookup, validates `is_active`/`expires_at`/`max_uses` vs `uses`/`used_by` dedupe-by-email. `free_membership_6mo` → grants `pro` plan for 6 months; `free_membership_1yr` → grants `business` plan for 12 months (both via `payment_provider:'promo'` `UserSubscription`). `bonus_listings` → increments `user.bonus_listing_slots`.
- **Dead field**: `bonus_listing_slots` is written here but **never read anywhere else in the codebase** — combined with `checkListingLimit` always allowing unlimited listings, this promo type currently has no observable effect. Flag for a product decision (wire it up for real, or drop the promo type).
- `managePromoCodes` (admin-only) — list/create/deactivate.

### 3.8 Messaging
- No dedicated "conversation" entity — `Message` rows carry a computed `conversation_id` (`[senderEmail, receiverEmail].sort().join(...)`), but **reads don't actually filter by it**: `Messages.jsx` runs two separate `.filter({sender_email})`/`.filter({receiver_email})` queries and merges/groups by counterpart email client-side in JS. No realtime/websocket — relies on TanStack Query's default `staleTime`/refetch-on-mount, so message delivery is not instant. The rebuild has an easy win here: real conversations table + Supabase Realtime (or equivalent) for instant delivery.
- `notifySuspiciousMessage` (flags messages to admins) and `notifyMatchingSavedSearches` (emails users whose `SavedSearch` matches a newly created `Listing`) are **never invoked by the frontend** — in Base44 these run as automations triggered on entity creation (`Message` create / `Listing` create respectively), using `asServiceRole`. **This automation-on-insert mechanism has no direct equivalent outside Base44** — the rebuild needs Postgres triggers (`AFTER INSERT`) calling an Edge Function, a queue, or a polling job to reproduce this.

### 3.9 Watchlist, saved searches, keyword alerts
- Saved listings: `useWatchlist.js` reads via `Watchlist.filter({user_email, type:'listing'})`, but the actual save/unsave *mutation* goes through `functions.invoke('toggleWatchlist', {listingId, action})` — not direct entity create/delete (likely because of validation/limits or notification side-effects server-side).
- Keyword alerts: same pattern via `toggleKeywordAlert` function.
- `SavedSearch` (the "save this filtered search + email me matches" feature, distinct from simple keyword watchlist) uses **direct** entity CRUD (`SavedSearch.create/update/delete`) — no function wrapper, and is the entity that `notifyMatchingSavedSearches` reads from.

### 3.10 Reviews, reports, blocking
- Reviews are submitted via `submitReview` function (not direct `Review.create`) — check `entry.ts` for validation (e.g. one review per buyer per listing, only after order completion) before assuming it's unguarded.
- Reports/blocks (`ReportBlockSheet.jsx`) use **direct** `Report.create`/`BlockedUser.create`, plus a client-side `SendEmail` call straight to a hardcoded admin address — i.e., moderation notifications bypass any server function entirely today.

### 3.11 Admin
- Listing moderation (approve/feature/ban via status update, hard-delete via `deleteListing`), `Report` triage (resolve/dismiss), `HelpContent`/`Announcement` CMS CRUD (direct entity calls), `managePromoCodes`, `sendBroadcastMessage` (mass message), `getAdminAnalytics` (site-wide charts), `getSellerStats` (per-seller stats, also reused on public seller cards/storefronts — not admin-only despite the name), `UserManagementTab` → `User.list/update` for role changes plus `adminUserActions` function (`get_stats|block|unblock|delete_account`) and direct admin→user `Message.create`. Note: **there are two separate account-deletion paths** — `deleteUserAccount` (self-service, called from `Profile.jsx`) and `adminUserActions{action:'delete_account'}` (admin-initiated) — verify both need to exist post-rebuild or whether they should be unified.

### 3.12 Misc integrations
- `geocodeLocation`: thin auth-required proxy to the free **Nominatim** (OpenStreetMap) geocoding API — no API key, just a `User-Agent` header. Trivial to port as-is (or call Nominatim directly from wherever it's needed, since it needs no secret).
- `VisitorLog`: lightweight page-view logging, deduped per `session_id`, used for admin visitor stats.

---

## 4. External services this system depends on (all need a decision when leaving Base44)

| Dependency | Used for | Notes for rebuild |
|---|---|---|
| Base44 Auth | login/session/guest gating | Replace with new auth provider entirely |
| Base44 Entities/DB | all data | Replace with real relational DB |
| Base44 `UploadFile` | listing/profile/service photos | Needs object storage + public URL serving |
| Base44 `SendEmail` | receipts, tracking, mod alerts, contact form | Needs a transactional email provider |
| Base44 `InvokeLLM` | AI listing title/description generation | Needs a direct LLM API call |
| Base44 `GenerateImage` | AI "enhance" listing photos | Needs an image-gen API |
| Base44 automations (`asServiceRole` on entity-insert) | suspicious-message flagging, saved-search match emails | Needs DB triggers + background jobs/Edge Functions |
| Base44 scheduled functions | `checkTrackingStatus` (~2h), `checkPendingPickups` (~hourly), `processSubscriptionRenewals` | Needs a cron mechanism |
| Stripe (Connect, PaymentIntents, subscriptions, webhooks, Checkout) | all payments/payouts | Unchanged — same Stripe account/logic, just re-hosted |
| 17Track API | shipment tracking polling | Unchanged |
| Nominatim (OpenStreetMap) | geocoding | Unchanged, no key needed |
| `@base44/vite-plugin` | dev HMR/analytics/visual-edit tooling | Removed entirely, not replaced |

---

## 5. Known bugs / dead code / ambiguities to resolve (not silently carry over)

1. **`ProtectedRoute.jsx` references `authChecked`/`checkUserAuth`, which `AuthContext.jsx` doesn't export** — currently broken/dead code path.
2. **`checkListingLimit` always returns `allowed:true`** — plan-based listing caps are effectively unenforced, contradicting `getSubscription.usage.can_create_listing`.
3. **`bonus_listing_slots` is written (by `applyPromoCode`) but never read anywhere** — dead field, `bonus_listings` promo type currently has no real effect.
4. **`processRefundOrCredit`'s `refund` action never calls Stripe's refund API** — only flips status; the source has a literal TODO. Not a working refund today.
5. **Fee-math constants are duplicated with slight drift** across `createPaymentIntent`, `addTrackingNumber`, `checkTrackingStatus`, `confirmLocalPickup` (e.g. Stripe fee estimated as `2.9%+$0.30` in one place vs `2.9%×1.08+$0.30` in another) — consolidate into one shared fee-calculation module in the rebuild.
6. **Explicit `stripe.transfers.create` calls alongside `transfer_data.destination`-based charges** — clarify intended payout model before reproducing; likely simplifiable.
7. **`Message.conversation_id` is stored but not used for querying** — functionally fine today (client merges in JS) but inefficient; easy improvement in rebuild (real `conversations` table + realtime).
8. **Two separate account-deletion code paths** (self-service `deleteUserAccount` vs admin `adminUserActions.delete_account`) — confirm both are needed.
9. **A separate hardcoded $9.99/mo Stripe Checkout subscription (`createStripeCheckout`) exists alongside the plan-based `MembershipPlan`/`UserSubscription` system** — clarify if still active/used or legacy.
10. **`notifySuspiciousMessage`/`notifyMatchingSavedSearches` rely on Base44's insert-triggered automations**, invisible from the frontend code — must not be silently dropped just because no frontend call references them.

---

## 6. What "same functionality" means for the rebuild (recommendation)

Reproduce all behavior in §3 faithfully, **except** the items in §5, which should each get an explicit decision (fix, keep-as-is-intentionally, or drop) rather than being copied blindly — since several are bugs/gaps rather than intended behavior. I'll flag each one again at the relevant point in the migration plan so they get resolved deliberately.

---

Next: use this as the baseline to design the new architecture (Supabase schema/RLS/Edge Functions, shared data-access layer, web migration, and the Expo mobile app), per the earlier direction (Supabase + React Native/Expo + same web stack cleaned up).
