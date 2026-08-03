"use client";

import { useEffect, useState } from "react";
import { getPayoutStatus, createPayoutOnboardingLink } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function PayoutsSection() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPayoutStatus(apiClient)
      .then((status) => {
        setConnected(status.connected);
        setPayoutsEnabled(status.payoutsEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function connect() {
    setRedirecting(true);
    setError(null);
    try {
      const { url } = await createPayoutOnboardingLink(apiClient);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Stripe onboarding");
      setRedirecting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="font-semibold text-sm">Seller Payouts</p>
      <p className="text-sm text-gray-500 mt-1">
        {payoutsEnabled
          ? "Stripe is connected — you can receive payments for sales."
          : connected
            ? "Stripe onboarding started but isn't finished yet — payouts are disabled until it's complete."
            : "Connect a Stripe account to receive payments when your listings sell."}
      </p>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        onClick={connect}
        disabled={redirecting}
        className="mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {redirecting ? "Redirecting…" : payoutsEnabled ? "Manage Stripe Account" : "Connect Stripe"}
      </button>
    </div>
  );
}
