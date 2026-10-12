import { supabaseAdmin } from "./supabase-admin";

/**
 * Only registration lives here now — actually *sending* a push happens in
 * the database (notify_user() via pg_net, see the notifications migration),
 * driven by triggers on messages/orders/reviews, so no API code path can
 * forget to send one.
 */
export async function registerPushToken(userId: string, token: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("push_tokens").upsert({ user_id: userId, token }, { onConflict: "user_id,token" });
  if (error) throw error;
}
