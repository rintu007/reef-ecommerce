import type { AppNotification } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Message notifications are excluded from the list and the unread count —
 * messages already have their own home (the Messages tab and its unread
 * badge), so repeating every chat line here would just bury the order and
 * review events this list exists for. They still drive the phone's
 * notification bar via Realtime on the client.
 */
export async function listNotifications(userId: string, limit = 50): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const db = supabaseAdmin();
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    db
      .from("notifications")
      .select("id, type, title, body, data, read_at, created_at")
      .eq("user_id", userId)
      .neq("type", "message")
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("type", "message")
      .is("read_at", null),
  ]);
  if (error) throw error;
  if (countError) throw countError;
  return { notifications: (data ?? []) as AppNotification[], unreadCount: count ?? 0 };
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}
