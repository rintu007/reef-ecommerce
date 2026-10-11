import { createPayoutOnboardingLink, getPayoutStatus } from "@reef-market/shared";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { apiClient } from "@/lib/api-client";

export interface PayoutStatusState {
  loading: boolean;
  connecting: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Returns the freshly-fetched status directly — reading hook state right after `await connect()` would be a stale closure, since the setState from the internal refresh() hasn't re-rendered the caller yet. */
  connect: () => Promise<{ connected: boolean; payoutsEnabled: boolean }>;
}

/**
 * Previously each screen opened the onboarding link with
 * WebBrowser.openBrowserAsync, which just launches a browser tab and
 * resolves the instant it's dismissed — whether the user finished Stripe's
 * form or not, and whichever way they closed it. Nothing ever re-checked
 * payout status afterward, so the app kept asking to connect even after a
 * seller fully completed onboarding (confirmed on Stripe's side).
 *
 * openAuthSessionAsync instead, watching for the reefmarket:// deep link.
 * Stripe's account_links API rejects a custom scheme outright for
 * return_url/refresh_url ("Not a valid URL" — it must be real https), so
 * those still point at a plain web page (apps/web/payout-return) that
 * immediately hands off to the reefmarket:// deep link itself — that
 * hop is what openAuthSessionAsync actually detects and closes on.
 * Either way, always refetch status once the session closes, since the
 * authoritative source is our own DB (kept in sync by the Connect webhook
 * — see api/webhooks/stripe-connect/route.ts), not whatever happened in
 * the browser.
 */
export function usePayoutStatus(): PayoutStatusState {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    const status = await getPayoutStatus(apiClient);
    setConnected(status.connected);
    setPayoutsEnabled(status.payoutsEnabled);
    return status;
  }, []);

  const refresh = useCallback(async () => {
    try {
      await fetchStatus();
    } catch {
      // best-effort — leave prior state on a transient failure
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const deepLink = Linking.createURL("payout-return");
      // Stripe needs a real https URL — this web page bounces straight to
      // deepLink itself, which is what openAuthSessionAsync is watching for.
      const bounceUrl = `${process.env.EXPO_PUBLIC_API_URL}/payout-return`;
      const { url } = await createPayoutOnboardingLink(apiClient, { returnUrl: bounceUrl, refreshUrl: bounceUrl });
      await WebBrowser.openAuthSessionAsync(url, deepLink);
      return await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Stripe onboarding");
      return { connected, payoutsEnabled };
    } finally {
      setConnecting(false);
    }
  }, [fetchStatus, connected, payoutsEnabled]);

  return { loading, connecting, connected, payoutsEnabled, error, refresh, connect };
}
