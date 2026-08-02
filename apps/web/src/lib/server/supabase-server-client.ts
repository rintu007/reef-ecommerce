import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "./env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Cookie-backed Supabase client for Server Components / Route Handlers —
 * this is the web session path. Mobile never uses this (it sends a Bearer
 * token instead, see auth.ts).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render, where cookies can't be
          // mutated — fine as long as middleware.ts keeps sessions refreshed.
        }
      },
    },
  });
}
