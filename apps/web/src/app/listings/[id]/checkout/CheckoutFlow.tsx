"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { checkout, computeCheckoutBreakdown, fromCents, type Listing, type Order } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { getStripe } from "@/lib/stripe-client";
import { BuyerAgreementModal } from "@/components/BuyerAgreementModal";

type ShippingMethod = "shipping" | "local_pickup";

export function CheckoutFlow({ listing }: { listing: Listing }) {
  const router = useRouter();
  // Buyer Agreement is shown fresh on every checkout attempt — no persistence,
  // matching legacy's BuyerAgreementModal/CheckoutModal behavior exactly.
  const [agreed, setAgreed] = useState(false);
  const [quantity, setQuantity] = useState(listing.min_qty);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    listing.shipping_available ? "shipping" : "local_pickup"
  );
  const [pickupTime, setPickupTime] = useState(listing.pickup_times[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ order: Order; clientSecret: string } | null>(null);

  const breakdown = useMemo(
    () =>
      computeCheckoutBreakdown({
        price: listing.price,
        quantity,
        shippingMethod,
        shippingTiers: listing.shipping_tiers,
        flatShippingCost: listing.shipping_cost,
        pickupPrice: listing.pickup_price,
        featured: listing.featured_fee,
      }),
    [listing, quantity, shippingMethod]
  );

  async function startPayment() {
    setError(null);
    setSubmitting(true);
    try {
      const { order, clientSecret } = await checkout(apiClient, {
        listing_id: listing.id,
        quantity,
        shipping_method: shippingMethod,
        pickup_time: shippingMethod === "local_pickup" ? pickupTime || undefined : undefined,
      });
      if (!clientSecret) throw new Error("Could not start payment");
      setCheckoutResult({ order, clientSecret });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkoutResult) {
    return (
      <Elements stripe={getStripe()} options={{ clientSecret: checkoutResult.clientSecret }}>
        <PaymentStep order={checkoutResult.order} />
      </Elements>
    );
  }

  if (!agreed) {
    return (
      <BuyerAgreementModal
        onAgree={() => setAgreed(true)}
        onClose={() => router.push(`/listings/${listing.id}`)}
      />
    );
  }

  const canOfferShipping = listing.shipping_available;
  const canOfferPickup = listing.local_pickup;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-4 bg-white flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {listing.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{listing.title}</p>
          <p className="text-sm text-gray-500">${listing.price.toFixed(2)} each</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={listing.min_qty}
          max={listing.quantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(listing.min_qty, Math.min(listing.quantity, Number(e.target.value))))}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Min {listing.min_qty}, {listing.quantity} available
        </p>
      </div>

      {canOfferShipping && canOfferPickup && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShippingMethod("shipping")}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${shippingMethod === "shipping" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Ship to me
            </button>
            <button
              onClick={() => setShippingMethod("local_pickup")}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${shippingMethod === "local_pickup" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              Local pickup
            </button>
          </div>
        </div>
      )}

      {shippingMethod === "local_pickup" && listing.pickup_times.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pickup_time">
            Pickup time
          </label>
          <select
            id="pickup_time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {listing.pickup_times.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>${fromCents(breakdown.itemSubtotalCents).toFixed(2)}</span>
        </div>
        {shippingMethod === "shipping" && (
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>${fromCents(breakdown.shippingCents).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
          <span>Total</span>
          <span>${fromCents(breakdown.totalChargedCents).toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={startPayment}
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Starting checkout…" : "Continue to Payment"}
      </button>
    </div>
  );
}

function PaymentStep({ order }: { order: Order }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/orders/${order.id}` },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    router.push(`/orders/${order.id}`);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Processing…" : `Pay $${order.total_charged?.toFixed(2)}`}
      </button>
    </form>
  );
}
