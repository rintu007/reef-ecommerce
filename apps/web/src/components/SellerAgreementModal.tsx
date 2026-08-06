"use client";

import { useState } from "react";

function FeeRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? "font-bold border-t border-gray-200 mt-1 pt-2" : ""}`}>
      <span className={highlight ? "text-gray-900" : "text-gray-500 text-sm"}>{label}</span>
      <span className={highlight ? "text-emerald-600 text-base" : "text-sm"}>{value}</span>
    </div>
  );
}

export function SellerAgreementModal({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-gray-200">
          <h2 className="font-bold text-lg">🛡️ Seller Agreement</h2>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-bold text-amber-800 mb-3">💲 What You&apos;ll Be Charged Per Sale</p>
            <p className="text-amber-700 text-xs mb-3">
              All fees are deducted from <strong>your payout</strong>. Reef Market&apos;s 5% platform fee and Stripe&apos;s
              processing fee apply to the <strong>full amount the buyer pays</strong> (item price + any shipping you
              charge). Here&apos;s an example with a $100 item and $15 shipping:
            </p>
            <div className="bg-white rounded-lg p-3 text-sm border border-amber-200 space-y-0.5">
              <FeeRow label="Buyer pays (item + shipping + tax)" value="~$123.30" />
              <FeeRow label="Your item price" value="$100.00" />
              <FeeRow label="Your shipping charge" value="$15.00" />
              <FeeRow label="Reef Market platform fee (5% of $115)" value="− $5.75" />
              <FeeRow label="Stripe processing fee (2.9% + $0.30)" value="− $3.64" />
              <FeeRow label="You receive" value="~$105.61" highlight />
            </div>
            <p className="text-xs text-amber-700 mt-2">
              The 5% fee and Stripe fee apply to the combined item + shipping total — not added on top for the buyer. If
              you set shipping to $0, the buyer pays only item price + tax.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1.5">💳 When You Get Paid</p>
            <p className="text-gray-500 mb-2">Payments are held by Stripe until the transaction is complete. Funds are released when:</p>
            <ul className="text-gray-500 space-y-1 list-disc list-inside">
              <li>
                <strong>Shipped orders:</strong> Carrier confirms delivery, or buyer confirms receipt
              </li>
              <li>
                <strong>Local pickup:</strong> Buyer confirms pickup in the app, or automatically after 3 business days
                with no dispute
              </li>
            </ul>
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <strong>⚡ Stripe setup required:</strong> After agreeing, you&apos;ll connect a Stripe payout account
              (~2 min). You&apos;ll need a bank account or debit card for deposits.
            </div>
          </div>

          <div>
            <p className="font-bold mb-1.5">🚚 Shipping Options — You&apos;re in Control</p>
            <ul className="text-gray-500 space-y-1 list-disc list-inside">
              <li>
                <strong>Flat shipping rate:</strong> One shipping cost added to the item price at checkout
              </li>
              <li>
                <strong>Tiered shipping by quantity:</strong> Different shipping prices for different quantities
              </li>
              <li>
                <strong>Minimum order quantity/amount:</strong> Require a minimum before checkout
              </li>
              <li>Package items safely — especially live animals — and choose a reliable carrier</li>
              <li>Enter a tracking number in your Orders dashboard after shipment</li>
              <li>Honor your stated DOA / arrival policy</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-1.5">✅ Your Responsibilities</p>
            <ul className="text-gray-500 space-y-1 list-disc list-inside">
              <li>Post accurate descriptions and real photos of the actual item</li>
              <li>Ship or arrange pickup within a reasonable timeframe after payment</li>
              <li>Comply with all laws regarding the sale and transport of live animals</li>
              <li>Provide an accurate pickup address and honor your stated pickup windows</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-1.5 text-red-600">⚠️ Prohibited Items</p>
            <p className="text-gray-500">
              Illegal species, stolen goods, endangered/protected animals, and misrepresented items are strictly
              prohibited and will result in immediate account suspension.
            </p>
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
              I understand that <strong>Reef Market&apos;s 5% fee and Stripe&apos;s processing fee are deducted from my
              payout</strong>. Fees apply to the full item + shipping total. I am responsible for shipping costs and
              agree to all terms above.
            </span>
          </label>
          <button
            type="button"
            disabled={!checked}
            onClick={onAgree}
            className="w-full h-12 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50"
          >
            I Agree — Continue to Payout Setup
          </button>
        </div>
      </div>
    </div>
  );
}
