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
 * openAuthSessionAsync instead, with a reefmarket:// deep link as the
 * return_url, so Stripe hands the user back into the app — then always
 * refetch status once the session closes, regardless of how it closed,
 * since the authoritative source is our own DB (kept in sync by the
 * Connect webhook — see api/webhooks/stripe-connect/route.ts), not
 * whatever happened in the browser.
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
      const redirectTo = Linking.createURL("payout-return");
      const { url } = await createPayoutOnboardingLink(apiClient, { returnUrl: redirectTo, refreshUrl: redirectTo });
      await WebBrowser.openAuthSessionAsync(url, redirectTo);
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
