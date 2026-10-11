import { getUnreadMessageCount } from "@reef-market/shared";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { apiClient } from "@/lib/api-client";

const POLL_INTERVAL_MS = 30_000;

/**
 * Drives the Messages tab badge (see (tabs)/_layout.tsx) — the only signal
 * today that a new message arrived if you're not already looking at the
 * conversation. Polls instead of a push/realtime subscription since
 * there's no push notification infra in this app yet (a bigger, separate
 * feature); this is the in-app-only version of "you got a message".
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
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchCount();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled]);

  return enabled ? count : 0;
}
