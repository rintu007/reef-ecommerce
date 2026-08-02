import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Service-role Supabase client — bypasses RLS. This is where essentially all
 * DB access happens (see the rebuild plan: "DB access only ever from
 * apps/web/lib/server/*, never shipped to any client"). Route Handlers and
 * Server Components both use this after resolving+authorizing the caller
 * themselves (see auth.ts) — RLS is defense-in-depth, not relied on here.
 */
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
