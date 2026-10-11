import { supabaseAdmin } from "./supabase-admin";

/**
 * Raw fetch against Expo's push API instead of installing expo-server-sdk —
 * it's one HTTP endpoint (https://exp.host/--/api/v2/push/send) that takes
 * a plain JSON array, so a server dependency isn't worth it for this.
 */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function registerPushToken(userId: string, token: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("push_tokens").upsert({ user_id: userId, token }, { onConflict: "user_id,token" });
  if (error) throw error;
}

export interface PushNotificationInput {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Best-effort, fire-and-forget by design — a failed push should never break
 * the action that triggered it (sending a message, placing an order). Every
 * caller already has the thing that matters (the message/order row) saved
 * before this runs.
 */
export async function sendPushNotification(userId: string, input: PushNotificationInput): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data: tokens, error } = await db.from("push_tokens").select("token").eq("user_id", userId);
    if (error) throw error;
    if (!tokens || tokens.length === 0) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
      sound: "default",
    }));

    // Expo's batch endpoint caps at 100 messages per request.
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
    }
  } catch (error) {
    console.error("sendPushNotification failed", userId, error);
  }
}
