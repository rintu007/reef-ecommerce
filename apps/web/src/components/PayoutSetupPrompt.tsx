"use client";

import { useState } from "react";
import { createPayoutOnboardingLink } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function PayoutSetupPrompt({ onSkip }: { onSkip: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createPayoutOnboardingLink(apiClient);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start setup. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white flex flex-col px-5 pt-10 pb-8">
      <div className="flex flex-col items-center text-center mb-8 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-3xl">💰</div>
        <h1 className="text-2xl font-bold mb-2">Set Up Your Payouts</h1>
        <p className="text-gray-500 text-sm">
          Connect a Stripe account so you can receive money when your items sell. This only takes a couple of minutes.
        </p>
      </div>

      <div className="space-y-3 mb-8 max-w-sm mx-auto w-full">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">How payments work</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">
              1
            </div>
            <div>
              <p className="font-semibold text-sm">Buyer purchases your item</p>
              <p className="text-xs text-gray-500">
                They pay the listing price + sales tax. You receive <strong>95%</strong> of your listing price
                (Reef Market&apos;s 5% fee + processing costs are deducted from your payout).
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">
              2
            </div>
            <div>
              <p className="font-semibold text-sm">Funds held securely</p>
              <p className="text-xs text-gray-500">Payment is held by Stripe while the order is in transit or awaiting pickup.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-xs">→</div>
            <div>
              <p className="font-semibold text-sm">Payment released to you</p>
              <p className="text-xs text-gray-500">
                Once delivery or pickup is confirmed, your 95% is deposited directly to your bank account via Stripe.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example — $100 listing</p>
          <div className="flex justify-between">
            <span className="text-gray-500">Buyer pays</span>
            <span className="font-medium">$100 + tax + Stripe fee</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reef Market fee (5%)</span>
            <span className="text-red-600 font-medium">− $5.00</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-bold">
            <span>You receive</span>
            <span className="text-emerald-600">$95.00</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What you&apos;ll need for setup</p>
          <div className="space-y-2 text-sm">
            <p>🏦 Bank account or debit card for deposits</p>
            <p>💳 Social Security Number (last 4 digits for identity)</p>
            <p>🛡️ Secure, encrypted — handled entirely by Stripe</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-3 mt-auto max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-base bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Connecting…" : "💰 Connect Payout Account"}
        </button>
        <button type="button" onClick={onSkip} className="w-full h-10 rounded-xl text-gray-500 text-sm">
          Set up later (you won&apos;t be able to receive payments until connected)
        </button>
      </div>
    </div>
  );
}
