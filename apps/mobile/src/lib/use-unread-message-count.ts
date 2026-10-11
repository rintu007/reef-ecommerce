import { getUnreadMessageCount } from "@reef-market/shared";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { apiClient } from "@/lib/api-client";

const POLL_INTERVAL_MS = 30_000;

/**
 * Drives the Messages tab badge (see (tabs)/_layout.tsx). The 30s poll is
 * just a safety net — the push notification listener below is what makes
 * this feel instant, refetching the instant a "message" push arrives
 * instead of waiting for the next poll tick.
 */
export function useUnreadMessageCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    async function fetchCount() {
      try {
        const { count } = await getUnreadMessageCount(apiClient);
        if (!cancelled) setCount(count);
      } catch {
        // best-effort — leave the last known count on a transient failure
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchCount();
    });
    const pushSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { type?: string };
      if (data?.type === "message") fetchCount();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      appStateSubscription.remove();
      pushSubscription.remove();
    };
  }, [enabled]);

  return enabled ? count : 0;
}
