# Legacy (Base44 / `reef-trade-flow`) → current app parity tracker

Source of truth for closing real feature gaps found by comparing the old
Base44 app (`reef-trade-flow/`, same content as `legacy/vite-app/`) against
the current `apps/web` + `apps/mobile`. Full original comparison is in this
file's git history / the conversation that produced it — this file tracks
**status**, updated as each item ships.

Rule for this whole effort: **only ever add missing legacy features back.
Never remove or "simplify away" anything already in the current apps that
legacy didn't have** — several areas (order admin actions, analytics charts,
promo code deletion, DOA/fee handling) are already *improvements* over
legacy and must stay exactly as they are.

## Pending DB migrations

None currently — `DATABASE_URL` was reset (new password) and
`20260820000001_admin_user_moderation.sql` has been applied and verified
(`profiles.banned_at` confirmed present). `supabase/.env` is up to date
with the working connection string.

## Status legend
- [ ] not started
- [~] in progress
- [x] done

## Genuinely missing — build these

- [x] **Admin user management** (biggest gap) — done
  - Block/unblock (`apps/web/src/lib/server/admin.ts` `banUser`/`unbanUser`, uses Supabase auth ban + `profiles.banned_at` mirror)
  - Delete (admin-initiated) — reuses `deleteOwnAccount` from `apps/web/src/lib/server/profiles.ts` (anonymize-if-has-orders, same as self-delete)
  - Per-user activity stats — `getUserActivityStats` in `apps/web/src/lib/server/admin.ts`
  - Admin→user in-app messaging — reuses existing `sendMessage`, no new backend needed
  - Grant promo to a user — reuses existing `redeemPromoCode`
  - New migration: `supabase/migrations/20260820000001_admin_user_moderation.sql` (adds `profiles.banned_at`) — **NOT YET APPLIED to the live DB**, needs to be run via your own DB access (see note below)
  - New routes: `apps/web/src/app/api/admin/users/[id]/{ban,stats,grant-promo}/route.ts`, `DELETE` added to existing `[id]/route.ts`
  - UI: `apps/web/src/app/admin/users/AdminUsersTable.tsx` and `apps/mobile/src/app/admin/users/index.tsx` fully rebuilt with expandable rows (stats, role, promo, block/delete, message)
  - Typecheck + lint clean on both apps

- [x] **Admin email broadcast to all users** — done
  - `apps/web/src/lib/server/email.ts` `sendBroadcastEmail` (chunked via Resend's batch API)
  - `apps/web/src/lib/server/announcements.ts` `broadcastAnnouncement` (in-app banner and/or email, matches legacy's `sendBroadcastMessage` semantics)
  - Route: `apps/web/src/app/api/admin/announcements/broadcast/route.ts`
  - UI: both `AdminAnnouncementsTable.tsx` (web) and mobile's announcements screen now have "Show as in-app banner" / "Email all users" toggles on the create form
  - ⚠️ Resend sandbox limitation: the `onboarding@resend.dev` sender can only actually deliver to the Resend account owner's own verified email until a custom sending domain is verified in the Resend dashboard — broadcasting to real users will report `emailsFailed` for everyone else until that's done
  - Typecheck + lint clean on both apps

- [x] **Support/Help screen on mobile** — done. New `apps/mobile/src/app/support.tsx`: FAQ accordion, tappable email/phone, contact form → `submitSupportMessage`. Linked from Profile's footer row.

- [x] **Web Support page: restore the contact/feedback form** — done. `apps/web/src/app/support/page.tsx` `ContactForm` restored, posts to the same new endpoint below.
  - Both share: `apps/web/src/lib/server/email.ts` `sendSupportMessage`, route `apps/web/src/app/api/support/route.ts` (public, no auth), client fn `submitSupportMessage`
  - Same Resend sandbox caveat as the broadcast feature — real delivery needs a verified sending domain
  - Typecheck + lint clean on both apps

- [x] **i18n / multi-language support** — done (scoped correctly, see below)
  - `apps/web/src/lib/language-context.tsx` + `apps/mobile/src/lib/language-context.tsx`: `LanguageProvider` — localStorage/AsyncStorage-first, profile-sync-for-signed-in-users, same pattern as `EULAGate`. `detectCountry`/`detectLanguage`/`COUNTRIES` were already ported in `packages/shared`, just unused — no new shared code needed for detection.
  - `apps/web/src/components/UserPrefsModal.tsx` + `apps/mobile/src/components/UserPrefsModal.tsx`: first-run picker, legacy parity with `UserPrefsModal.jsx`. Wired into both root layouts alongside `EULAGate`.
  - Turned out **both apps already had** an inline editable language/country field in Profile (not a gap) — wired those save handlers to also call the new context's `savePrefs()` so `useT()` picks up a change immediately instead of waiting for reload.
  - Applied `useT()` to real UI strings on **Browse** (both apps) + web's `BrowseFilters.tsx` — search placeholder, type/category/delivery filter pills, sort labels, "near me"/"locating", empty-state text. Deliberately did **not** attempt to translate the entire app: the ~90-key dictionary was legacy's own scope too (short UI chrome, not long-form content like About/FAQ/admin panels which were never in the dictionary to begin with) — translating strings that were never part of the source dictionary isn't "restoring parity," it's a new feature. Rolling `useT()` out to more screens later is straightforward now that the infra exists — same `useLanguagePrefs()` + `useT(lang)` pattern.
  - Typecheck + lint clean on both apps

## Partially implemented — worth completing

- [x] **Announcement editing** — done. Mobile already had a full edit form; web's `AdminAnnouncementsTable.tsx` was rebuilt to add one (backend `PATCH` already supported every field, this was purely a web UI gap)

- [x] **Consolidated seller dashboard** — done
  - `apps/web/src/lib/server/orders.ts` `getSellerDashboardMetrics` (4 lightweight count/sum queries in parallel, not a full row fetch) — matches legacy's exact "revenue" definition (sum of `price` on completed orders, not the post-fee payout amount)
  - Route: `apps/web/src/app/api/seller/dashboard/route.ts`, client fn `getSellerDashboardMetrics`
  - Web: metrics grid added to top of `apps/web/src/app/my-listings/page.tsx` (computed server-side, no extra client round trip)
  - Mobile: metrics grid added as `ListHeaderComponent` on `apps/mobile/src/app/(tabs)/sell.tsx`
  - Typecheck + lint clean on both apps

## Already fully covered — no action needed (confirmed by deep comparison)

Listings moderation, reports triage (improved), order admin actions (improved — refund/deny-claim beyond legacy's read-only view), sales/app analytics (improved — has charts legacy lacked), promo codes (improved — adds delete), help content CRUD, quick-edit listings, payout/Stripe Connect setup, fee calculator (fee math centralized & improved vs. legacy's drifting constants), reviews, EULA gate, report/block moderation, Services CRUD, DOA claim handling, Marketing/DownloadApp/FreshwaterLanding pages (web-only, correctly not on mobile), CategoryPage/SearchPage (folded into Browse filters — architectural choice, not a capability loss).

## Correctly left in the past — not worth porting

Base44 SDK client (`base44Client.js`), invite-only guest-login flow (`GuestLoginScreen.jsx`, `UserNotRegisteredError.jsx`), React Router route guards (`ProtectedRoute.jsx`), React Router/TanStack Query/localStorage-shim plumbing (`NavHistoryContext.jsx`, `query-client.js`, `safe-storage.js`) — all superseded by the current Supabase/Next.js/Expo Router stack.

## Second deep-dive pass (post-fix verification + fresh scan)

All 7 previously-fixed items above were independently re-verified line-by-line against legacy — confirmed correct, no bugs, no regressions. A fresh scan (listings/profile/hooks/ListingDetail, areas not the focus of pass 1) found:

- [x] **A. Saved Searches never actually notify anyone (moderate)** — done
  - `apps/web/src/lib/server/saved-searches.ts` `notifyMatchingSavedSearches` — ported legacy's exact `listingMatchesSearch` matching logic (type/category/max_price/shipping/pickup/keyword), de-dupes to one email per user across multiple matching searches
  - `apps/web/src/lib/server/email.ts` `sendSavedSearchMatchEmail` — same template/content as legacy
  - Wired into `apps/web/src/app/api/listings/route.ts` `POST` via Next's `after()` (not a bare unawaited promise — Vercel's serverless runtime can kill a function right after the response flushes, `after()` is the documented way to run work post-response reliably). Failures are caught and logged, never surface as a listing-creation error.
  - Same Resend sandbox caveat as the other email features
  - Typecheck + lint clean
- [x] **B. "Keyword Alerts" watchlist type is unused dead code (low, not fixing)** — `watchlistTypeSchema` still has `"keyword"` but no UI/API uses it in either app. Legacy itself never wired notifications for it either (same gap existed there), so this isn't a lost working feature — leaving as-is, matches the "not worth porting" bucket.
- [x] **C. Mobile listing detail missing min-qty/min-order badges** — web shows them, mobile didn't. Enforcement was never affected (server-side + checkout clamp already correct on both), purely a disclosure-UI gap. Fixed.
- [x] **D. Web browse grid missing badges mobile's `ListingCard` already has** — Featured badge, shipping/pickup icons, quantity text. Brought web's grid card up to the same richness as mobile's.

## Process

1. Work top-down through "Genuinely missing", then "Partially implemented".
2. After each item ships, mark it `[x]` here and re-verify it actually works end-to-end (typecheck + lint + a real check, not just "code exists").
3. Once the list is clear, do a second full deep-dive re-comparison against `reef-trade-flow/` from scratch to catch anything missed the first time, and add any newly-found gaps back into this file rather than assuming the list above is exhaustive.
