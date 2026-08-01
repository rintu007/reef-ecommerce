# Reef Market — Project Analysis

## 1. What this is

**Reef Market** is a marketplace web app for buying and selling live aquarium livestock (corals, fish, invertebrates) and equipment, plus aquarium-related services (tank building, cleaning, aquascaping, etc.). It serves two distinct sub-markets — **saltwater/reef** and **freshwater** — from a single codebase, with market-aware routing, filtering, and landing pages.

The app is built on **[Base44](https://base44.com)**, a low-code backend platform: the `base44/` directory declares the backend schema (entities) and serverless functions declaratively, while `src/` is a standard Vite + React SPA that consumes them through the `@base44/sdk`. Any change pushed to the repo is reflected in the Base44 Builder, and deployment/publishing happens through Base44.com rather than a traditional CI/CD pipeline.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Build tool | Vite 6 (`@vitejs/plugin-react`, `@base44/vite-plugin`) |
| UI framework | React 18 + React Router 6 |
| Styling | Tailwind CSS 3 + `tailwindcss-animate`, shadcn/ui-style component set (Radix UI primitives + `class-variance-authority` + `clsx`/`tailwind-merge`) |
| Data/server state | TanStack Query 5 |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Backend | Base44 (`@base44/sdk`) — hosted entities, RLS-style read rules, and TypeScript serverless functions (`base44/functions/*/entry.ts`) |
| Payments | Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`) via Base44 functions, including Stripe Connect for seller payouts |
| Other notable libs | `react-leaflet` (maps/geocoding), `recharts` (admin analytics), `framer-motion` (animation), `@hello-pangea/dnd` (drag-and-drop, likely photo reordering), `jspdf`/`html2canvas` (PDF export), `three` (possibly 3D/visual flourish), `canvas-confetti`, `react-quill` (rich text), `moment`/`date-fns`, `sonner`/`react-hot-toast` (toasts), `i18n` custom lib (multi-language) |
| Type checking | `jsconfig.json` + `tsc` (JS project with type-checking, not a full TS migration — functions in `base44/functions` are `.ts`) |
| Lint | ESLint 9 flat config, with `unused-imports`, `react`, `react-hooks`, `react-refresh` plugins |

No test runner (Jest/Vitest/Playwright) is configured — there is no automated test suite in this project currently.

## 3. Backend model (`base44/`)

Base44 apps define their backend as data, checked into the repo:

- **`base44/config.jsonc`** — app name ("Reef Market") and build/serve commands.
- **`base44/entities/*.jsonc`** — JSON-Schema-like definitions for each data model, each becoming a hosted collection/table with generated CRUD via the SDK. Row-level security (`rls: { read: true }`) is used selectively to make certain entities (Listing, Service, Announcement) publicly readable.
- **`base44/functions/*/entry.ts`** — serverless TypeScript functions invoked from the frontend for anything needing privileged logic (payments, admin actions, notifications).

### Entities (18 total)

| Entity | Purpose |
|---|---|
| `Listing` | Core marketplace item — coral, fish, sw_invert, fw_fish/amphibian/turtle/other, or equipment. Rich schema: pricing (incl. tiered shipping, min qty/order amount), care attributes (light/flow requirement, difficulty, reef-safe, temperament), equipment attributes (brand/model/condition), shipping/pickup logistics, DOA (dead-on-arrival) policy, and status lifecycle (`active/sold/pending_approval/removed`). |
| `Service` | Non-listing marketplace: professional services (tank building, cleaning, aquascaping, fragging, fish-sitting, etc.) with location/service-area/nationwide flags. |
| `Order` | Purchase record with buyer/seller emails, pricing breakdown (price, tax, buyer service fee, total charged), shipping vs. local-pickup flow, tracking info, and a status machine covering both shipped and pickup paths (`pending → confirmed → shipped/awaiting_pickup → delivered/pickup_confirmed → completed`, plus `cancelled`/`doa_claim`). |
| `User` | Profile extension (role, display name, avatar, bio, tank photos, location, language, country) plus a `verified_seller` flag auto-granted after 10 completed sales (grants instant payout on tracking upload). |
| `Message` / conversations keyed by sorted sender+receiver email pair, linked to a listing. |
| `Review` | Seller/buyer ratings (1–5 stars) tied to a listing. |
| `Watchlist` | Saved listings and keyword alerts per user. |
| `SavedSearch` | Persisted search filters with email notification opt-in. |
| `Report` / `BlockedUser` | Trust & safety — reporting listings/sellers and user-level blocking. |
| `MembershipPlan` / `UserSubscription` | Tiered seller plans (free/pro/business) gating `max_active_listings`, backed by Stripe subscriptions. |
| `PromoCode` | Admin-issued codes granting free membership periods or bonus listing slots. |
| `UserCredit` | Store credit ledger (e.g., DOA claim refunds) with expiry. |
| `SellerPayoutAccount` | Stripe Connect Express account linkage and onboarding/payout status per seller. |
| `Announcement` | Site-wide popup messaging with per-user view caps and guest visibility toggle. |
| `HelpContent` | CMS-style help center content (videos/articles/tips/FAQ) categorized by market and topic. |
| `VisitorLog` | Lightweight session-deduplicated page-view analytics. |

### Serverless functions (`base44/functions/`, ~40 functions)

Grouped by concern:

- **Payments & checkout**: `createPaymentIntent`, `createCartPaymentIntent`, `createCartOrders`, `createOrderAfterPayment`, `createStripeCheckout`, `stripeWebhook`, `applyPromoCode`.
- **Seller payouts**: `createConnectAccount`, `releasePaymentToSeller`, `checkAndGrantVerifiedSeller`.
- **Order lifecycle**: `addTrackingNumber`, `checkTrackingStatus`, `notifyBuyerOfTracking`, `confirmLocalPickup`, `checkPendingPickups`, `cancelOrder`, `deleteOrder`, `processRefundOrCredit`.
- **Listings**: `getPublicListings`, `checkListingLimit`, `deleteListing`.
- **Subscriptions/plans**: `getPlans`, `getSubscription`, `updateSubscription`, `cancelStripeSubscription`, `processSubscriptionRenewals`.
- **Notifications**: `notifySellerOfSale`, `notifyMatchingSavedSearches`, `notifySuspiciousMessage`, `sendBroadcastMessage`.
- **Admin/moderation**: `adminUserActions`, `managePromoCodes`, `getAdminAnalytics`, `getSellerStats`, `deleteUserAccount`.
- **Reviews**: `submitReview`.
- **Misc**: `geocodeLocation`, `toggleWatchlist`, `toggleKeywordAlert`.

This confirms a full-featured two-sided marketplace: escrow-style payments (Stripe PaymentIntents held then released to seller, i.e. a "buyer protection" model), Stripe Connect for seller payouts, subscription-gated listing limits, DOA/refund handling, and proactive notification of saved searches/keyword alerts.

## 4. Frontend structure (`src/`)

```
src/
├── api/base44Client.js       Base44 SDK client init (reads VITE_BASE44_APP_ID / VITE_BASE44_APP_BASE_URL)
├── App.jsx                   Router root, auth gating, lazy-loaded routes
├── main.jsx                  Entry point
├── lib/                      Cross-cutting contexts & utilities
│   ├── AuthContext.jsx         auth state, guest mode, login redirect
│   ├── CartContext.jsx         shopping cart
│   ├── NavHistoryContext.jsx   back-navigation stack for the mobile-app-like slide transitions
│   ├── UserPrefsContext.jsx    user preference modal/state
│   ├── market-context.jsx      saltwater vs freshwater market selection
│   ├── i18n.js, categories.js, countries.js, currencies.js, app-params.js, safe-storage.js, query-client.js, utils.js
├── hooks/                     use-mobile, usePullToRefresh, useWatchlist
├── pages/                     Route-level screens (see below)
└── components/
    ├── layout/                AppShell, TopNav, BottomNav (mobile-app-style shell/tab bar)
    ├── home/, listings/, sell/, seller/, profile/, reviews/, moderation/
    ├── payments/               CheckoutModal, CartCheckoutModal, BuyerAgreementModal, OrderReceiptModal
    ├── admin/                  AdminOrdersTab, AppAnalyticsTab, SalesAnalyticsTab, UserManagementTab, VisitorStatsSection
    └── ui/                     shadcn/ui-style primitives (Radix wrappers)
```

### Routing / pages

`App.jsx` uses React Router with an interesting pattern: top-level tabs (`/`, `/browse`, `/messages`, `/orders`, `/learn`, `/profile`, `/services`) are rendered *inside* `AppShell` as null routes — `AppShell`/`BottomNav` handle them directly, giving a native-app-like tab bar instead of full page reloads. Secondary/"child" screens (listing detail, category page, sell flow, admin, seller dashboard, help, search, seller storefront) are lazy-loaded and rendered with a slide-in transition via `NavHistoryContext`, mimicking mobile navigation stacks. Standalone pages outside the shell: `/download` (app download promo), `/freshwater` (freshwater landing/market picker), `/support`, `/about` (marketing).

Auth flow: `AuthContext` distinguishes `isLoadingAuth`/`isLoadingPublicSettings`, an `authError` state (`user_not_registered` vs `auth_required`), and a guest mode (`GuestLoginScreen` / `continueAsGuest`) — `/support` and `/about` remain accessible without login.

### Key feature areas (by component folder)

- **`sell/`** — multi-step listing creation/editing flow (photos, pricing, care attributes, shipping).
- **`listings/`** — browse/search result cards, filters.
- **`seller/`** — seller dashboard widgets (stats, payouts).
- **`payments/`** — Stripe Elements-based checkout, cart checkout, buyer protection agreement, receipts.
- **`moderation/`** — reporting/blocking UI tied to `Report`/`BlockedUser` entities.
- **`admin/`** — internal ops console: order oversight, app-wide and sales analytics (recharts), user management, visitor stats.
- **`reviews/`**, **`profile/`**, **`home/`** — self-explanatory.

## 5. Domain model summary

This is a **dual-vertical C2C/B2C marketplace**:

1. **Saltwater/reef market** — corals (with frag size, lighting/flow needs), fish, saltwater invertebrates, equipment.
2. **Freshwater market** — fish, amphibians, turtles, other livestock, equipment — with its own landing page (`FreshwaterLanding.jsx`) and market-scoped browsing.

On top of listings, it layers:
- **Logistics duality**: every listing can support shipping (with tiered pricing by quantity, per-country shipping list) and/or local pickup (with address/time slots and a pickup-confirmation handshake between buyer and seller).
- **Trust & safety**: DOA policies per listing, buyer protection toggle on orders, reporting/blocking, admin moderation queue (`pending_approval` listing status), suspicious-message detection hook.
- **Monetization**: tiered seller subscriptions (free/pro/business) capping active listing counts, featured-listing fees, promo codes for free membership or bonus listings — i.e., a freemium seller model.
- **Payments**: Stripe PaymentIntent-based checkout (single item and cart), held and then explicitly "released" to seller (`releasePaymentToSeller`) — consistent with an escrow/buyer-protection model — with Stripe Connect Express for seller onboarding/payouts, and store credit as a refund alternative.
- **Growth/retention**: saved searches and keyword watchlists with matching notifications, seller verification badge after 10 sales, reviews, a Learn/Help content hub, and visitor analytics.

## 6. Notable architectural choices

- **SPA styled like a native app**: persistent bottom tab bar + slide-in "push" navigation for secondary screens, rather than conventional multi-page routing — suggests this targets mobile-web/PWA-like usage (there's also a `/download` page, hinting at a companion native app or PWA install prompt).
- **Backend-as-config**: no hand-written REST/GraphQL API layer in this repo — the entity `.jsonc` files *are* the API contract, and Base44 generates CRUD + auth + RLS from them. All custom/privileged logic lives in the `base44/functions` TypeScript functions, which the SDK calls directly from the client.
- **No test suite**: risk area — payment, order-status, and admin-permission logic (financially and operationally sensitive) have no automated coverage today.
- **Environment config**: `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` (see README) are the only required local env vars — the rest of the backend (Stripe keys, etc.) is presumably managed inside Base44's hosted function environment, not in this repo.

## 7. Suggested next steps (if useful)

- If you want deeper documentation, good candidates are: the checkout/payment flow (`CheckoutModal.jsx`, `CartCheckoutModal.jsx`, `createPaymentIntent`/`createCartOrders` functions) end-to-end, the order status state machine, or the subscription/listing-limit enforcement logic.
- Given there's no test suite, consider whether critical paths (payment intent creation, order status transitions, admin actions) warrant test coverage before further feature work.
