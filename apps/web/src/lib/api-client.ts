import { createApiClient } from "@reef-market/shared";
import { createSupabaseBrowserClient } from "./supabase-browser";

/**
 * Browser-side instance of the shared API client. Relative baseUrl since web
 * calls its own Route Handlers same-origin (cookies ride along automatically);
 * the Bearer token is attached too so the pattern matches apps/mobile exactly.
 */
export const apiClient = createApiClient({
  baseUrl: "",
  getAccessToken: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
