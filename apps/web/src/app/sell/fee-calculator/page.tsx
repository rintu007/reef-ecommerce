"use client";

import { useMemo, useState } from "react";
import { computeCheckoutBreakdown, fromCents } from "@reef-market/shared";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className={`text-sm ${emphasis ? "font-semibold text-gray-900" : "text-gray-500"}`}>{label}</span>
      <span className={`text-sm ${emphasis ? "font-semibold text-gray-900" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}

export default function FeeCalculatorPage() {
  const [price, setPrice] = useState("25.00");
  const [quantity, setQuantity] = useState("1");
  const [shippingMethod, setShippingMethod] = useState<"shipping" | "local_pickup">("shipping");
  const [shippingCost, setShippingCost] = useState("6.00");
  const [featured, setFeatured] = useState(false);

  const breakdown = useMemo(() => {
    const priceNum = Number(price) || 0;
    const quantityNum = Math.max(1, Number(quantity) || 1);
    return computeCheckoutBreakdown({
      price: priceNum,
      quantity: quantityNum,
      shippingMethod,
      flatShippingCost: Number(shippingCost) || 0,
      featured,
    });
  }, [price, quantity, shippingMethod, shippingCost, featured]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Selling Fee Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Estimate what you&apos;ll actually receive after Reef Market&apos;s platform fee and Stripe&apos;s processing fee.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              min="1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShippingMethod("shipping")}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${shippingMethod === "shipping" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Ship to buyer
            </button>
            <button
              onClick={() => setShippingMethod("local_pickup")}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${shippingMethod === "local_pickup" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Local pickup
            </button>
          </div>
        </div>

        {shippingMethod === "shipping" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping cost charged to buyer ($)</label>
            <input
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured listing fee
        </label>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Row label="Item subtotal" value={`$${fromCents(breakdown.itemSubtotalCents).toFixed(2)}`} />
          {shippingMethod === "shipping" && <Row label="Shipping charged to buyer" value={`$${fromCents(breakdown.shippingCents).toFixed(2)}`} />}
          <Row label="Buyer pays (total)" value={`$${fromCents(breakdown.totalChargedCents).toFixed(2)}`} emphasis />
          <div className="h-px bg-gray-200 my-2" />
          <Row label="Platform fee (5%)" value={`-$${fromCents(breakdown.platformFeeCents).toFixed(2)}`} />
          {featured && <Row label="Featured listing fee" value={`-$${fromCents(breakdown.featuredFeeCents).toFixed(2)}`} />}
          <Row label="Est. Stripe processing fee" value={`-$${fromCents(breakdown.stripeFeeEstimateCents).toFixed(2)}`} />
          <div className="h-px bg-gray-200 my-2" />
          <Row label="You receive (estimate)" value={`$${fromCents(breakdown.sellerReceivesEstimateCents).toFixed(2)}`} emphasis />
        </div>

        <p className="text-xs text-gray-400">This is an estimate only — actual payout is determined by Stripe at the time of sale.</p>
      </div>
    </div>
  );
}
