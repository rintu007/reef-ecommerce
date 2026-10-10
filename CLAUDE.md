# Reef Market — project rules

## Mobile-first: all product work goes into the React Native app

The React Native app (`apps/mobile`, Expo) is the product that ships to the
App Store and Google Play for real users. Every feature, UI change, and bug fix
is done there.

- Build and change screens/components in `apps/mobile/src` only. Do not build
  new UI in `apps/web` unless the user explicitly asks for web.
- `apps/web` stays because it hosts the API (`apps/web/src/app/api/*`, plus
  `apps/web/src/lib/server/*`) that the mobile app calls through
  `EXPO_PUBLIC_API_URL`. Backend changes a mobile feature needs go there, and
  database changes go in `supabase/migrations`.
- Shared types and logic go in `packages/shared`.
- `base44/`, `legacy/`, and `reef-trade-flow/` are the old system: reference
  only, never edit.
- Before writing Expo code, follow `apps/mobile/AGENTS.md` (Expo v57 docs).
- Changes must work in a real store build, not just in dev. Don't hardcode
  `localhost` or test-only values, and keep store-launch blockers in mind
  (iOS bundle ID, production API URL, live Stripe keys, removing dummy data;
  see `DUMMY_DATA.md`).
