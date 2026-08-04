import { createApiClient } from "@reef-market/shared";
import { supabase } from "./supabase";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL (see .env.local) — must point at the apps/web Next.js server");
}

/**
 * Same shared client apps/web uses (packages/shared/src/api-client.ts), just
 * pointed at an absolute baseUrl instead of same-origin, and resolving the
 * Bearer token from the RN Supabase session instead of cookies — this is
 * exactly the mobile use case that client was built for.
 */
export const apiClient = createApiClient({
  baseUrl,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
