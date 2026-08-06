"use client";

import { useState } from "react";

/**
 * Shown on EVERY checkout attempt (single-item and cart) — matching legacy
 * (legacy/vite-app/src/components/payments/BuyerAgreementModal.jsx) exactly.
 * Deliberately NOT persisted anywhere (no profile field, no localStorage) —
 * unlike the EULA/Seller Agreement gates, which do persist.
 */
export function BuyerAgreementModal({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-gray-200">
          <h2 className="font-bold text-lg">🛡️ Buyer Agreement</h2>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3 text-sm">
          <p className="text-gray-500">Please read and agree to the following before purchasing on Reef Market.</p>

          <div>
            <p className="font-bold mb-1">💳 What You Pay</p>
            <p className="text-gray-500 mb-2">
              As a buyer, you pay the <strong>item price + any shipping the seller has set + sales tax. No platform fees
              or processing fees are ever added to your total.</strong>
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-gray-900 mb-1">Example — buying a coral listed at $100 with $15 shipping:</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Listing price</span>
                <span>$100.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seller&apos;s shipping charge</span>
                <span>$15.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sales tax (varies by state)</span>
                <span>~$8.30</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
                <span>You pay</span>
                <span className="text-blue-600">~$123.30</span>
              </div>
              <p className="text-gray-500 mt-1.5 italic">
                Reef Market&apos;s 5% fee and Stripe&apos;s processing fee are deducted from the <strong>seller&apos;s
                payout</strong> — never added to your price. If a seller sets shipping to $0, you only pay item price +
                tax.
              </p>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Some sellers offer <strong>tiered shipping pricing</strong> — the shipping cost may vary depending on how
              many items you buy. The final shipping cost is always shown clearly before you confirm payment.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">🔒 Funds Are Held Securely</p>
            <p className="text-gray-500">
              Your payment is held by Reef Market and is <strong>not released to the seller until delivery or pickup is
              confirmed</strong>. This protects you as a buyer.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">📦 Shipped Orders</p>
            <p className="text-gray-500">
              Once the seller ships your item and enters a tracking number, your order status updates to &quot;Shipped.&quot;
              Funds are released to the seller automatically when the tracking shows delivery. You can also manually
              confirm receipt to release funds early.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">📍 Local Pickup Orders</p>
            <p className="text-gray-500">
              For local pickup, you will receive the <strong>exact pickup address and your chosen pickup time</strong> in
              your order confirmation. Funds are held until:
            </p>
            <ul className="text-gray-500 space-y-1 list-disc list-inside mt-1">
              <li>The seller marks the item as picked up, AND you confirm pickup via email, OR</li>
              <li>3 business days pass after the seller marks pickup — at which point pickup is assumed successful and funds are released automatically.</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-1">🐟 DOA / Arrival Policy</p>
            <p className="text-gray-500">
              Each seller sets their own Dead on Arrival (DOA) policy for live animals. Always review the seller&apos;s
              policy before purchasing. For DOA claims, photo proof of the animal still in a sealed bag is typically
              required <strong>within 2 hours of delivery</strong>.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">❌ Cancellations &amp; Refunds</p>
            <p className="text-gray-500">
              All sales are final unless the seller&apos;s DOA policy provides otherwise. If you have an issue with an
              order, contact the seller directly through messaging. Reef Market may intervene in disputes at its
              discretion.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">✅ Your Responsibilities</p>
            <ul className="text-gray-500 space-y-1 list-disc list-inside">
              <li>Be present or available at the agreed pickup time</li>
              <li>Confirm receipt of shipped items promptly</li>
              <li>Confirm or dispute pickup within 3 business days</li>
              <li>Follow all applicable local laws regarding live animal purchase</li>
            </ul>
          </div>
        </div>

        <div className="px-5 pt-3 pb-5 shrink-0 border-t border-gray-200 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0"
            />
            <span className="text-sm text-gray-900 leading-snug">
              I have read and agree to the Reef Market Buyer Agreement, including the payment hold policy and
              pickup/delivery terms.
            </span>
          </label>
          <button
            type="button"
            disabled={!checked}
            onClick={onAgree}
            className="w-full h-12 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50"
          >
            Agree &amp; Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
