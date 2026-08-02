"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon-key Supabase client for Client Components. Used for: the auth UI
 * (sign in/up/session), and Supabase Realtime subscriptions (messages) — the
 * one deliberate exception to "everything goes through the Next.js API", per
 * the rebuild plan. Not for arbitrary data reads/writes; those go through
 * @reef-market/shared's API client against apps/web's Route Handlers.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
