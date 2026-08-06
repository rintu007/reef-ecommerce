"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { checkoutCart, computeCheckoutBreakdown, fromCents, getListing, type CartCheckoutItemResult, type Listing } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { useCart, type CartItem } from "@/lib/cart-context";
import { getStripe } from "@/lib/stripe-client";

function PaymentStep({ onDone, label }: { onDone: () => void; label: string }) {
  const stripe = useStripe();
  const elements = useElements();
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
      confirmParams: { return_url: window.location.href },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Processing…" : "Pay"}
      </button>
    </form>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearItems } = useCart();
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payable, setPayable] = useState<CartCheckoutItemResult[] | null>(null);
  const [payIndex, setPayIndex] = useState(0);
  const [failures, setFailures] = useState<CartCheckoutItemResult[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    Promise.all(items.map((item) => getListing(apiClient, item.listingId).then((r) => r.listing).catch(() => null))).then((results) => {
      const map: Record<string, Listing> = {};
      results.forEach((listing) => {
        if (listing) map[listing.id] = listing;
      });
      setListings(map);
      setLoading(false);
    });
  }, [items]);

  const grouped = useMemo(() => {
    const bySeller: Record<string, { seller_id: string; items: CartItem[] }> = {};
    for (const item of items) {
      const listing = listings[item.listingId];
      if (!listing) continue;
      const key = listing.seller_id;
      if (!bySeller[key]) bySeller[key] = { seller_id: key, items: [] };
      bySeller[key].items.push(item);
    }
    return Object.values(bySeller);
  }, [items, listings]);

  const grandTotalCents = useMemo(() => {
    return items.reduce((sum, item) => {
      const listing = listings[item.listingId];
      if (!listing) return sum;
      const breakdown = computeCheckoutBreakdown({
        price: listing.price,
        quantity: item.quantity,
        shippingMethod: item.shippingMethod,
        shippingTiers: listing.shipping_tiers,
        flatShippingCost: listing.shipping_cost,
        pickupPrice: listing.pickup_price,
        featured: listing.featured_fee,
      });
      return sum + breakdown.totalChargedCents;
    }, 0);
  }, [items, listings]);

  async function handleCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      const { results } = await checkoutCart(apiClient, {
        items: items.map((item) => ({
          listing_id: item.listingId,
          quantity: item.quantity,
          shipping_method: item.shippingMethod,
          pickup_time: item.pickupTime,
        })),
      });
      const succeeded = results.filter((r) => r.clientSecret);
      const failed = results.filter((r) => !r.clientSecret);
      setFailures(failed);
      if (succeeded.length === 0) {
        setError("None of your cart items could be checked out. See details below.");
      } else {
        setPayable(succeeded);
        setPayIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  function handleItemPaid() {
    if (!payable) return;
    const paidListingId = payable[payIndex].listing_id;
    clearItems([paidListingId]);
    if (payIndex + 1 < payable.length) {
      setPayIndex(payIndex + 1);
    } else {
      router.push("/orders");
    }
  }

  if (payable) {
    const current = payable[payIndex];
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-bold mb-4">
          Paying item {payIndex + 1} of {payable.length}
        </h1>
        <Elements stripe={getStripe()} options={{ clientSecret: current.clientSecret! }}>
          <PaymentStep label={listings[current.listing_id]?.title ?? "Item"} onDone={handleItemPaid} />
        </Elements>
      </div>
    );
  }

  if (loading) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center py-16">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/browse" className="text-blue-600 hover:underline text-sm font-semibold mt-2 inline-block">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {failures.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm">
          <p className="font-semibold text-amber-900">Some items couldn&apos;t be checked out:</p>
          <ul className="mt-1 space-y-0.5 text-amber-800">
            {failures.map((f) => (
              <li key={f.listing_id}>
                {listings[f.listing_id]?.title ?? f.listing_id}: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.seller_id} className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Seller</p>
            <div className="space-y-3">
              {group.items.map((item) => {
                const listing = listings[item.listingId];
                if (!listing) return null;
                return (
                  <div key={item.listingId} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {listing.photos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/listings/${listing.id}`} className="text-sm font-semibold hover:underline truncate block">
                        {listing.title}
                      </Link>
                      <p className="text-xs text-gray-500">${listing.price.toFixed(2)} each</p>
                    </div>
                    <input
                      type="number"
                      min={listing.min_qty}
                      max={listing.quantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.listingId, Math.max(listing.min_qty, Math.min(listing.quantity, Number(e.target.value))))}
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button onClick={() => removeItem(item.listingId)} className="text-xs font-semibold text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-6 flex justify-between font-semibold text-sm">
        <span>Estimated total</span>
        <span>${fromCents(grandTotalCents).toFixed(2)}</span>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full mt-4 rounded-lg bg-blue-600 text-white text-sm font-semibold py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {checkingOut ? "Starting checkout…" : `Checkout ${items.length} item${items.length === 1 ? "" : "s"}`}
      </button>
      <p className="text-xs text-gray-400 mt-2 text-center">
        You&apos;ll pay for each item one at a time — Stripe processes each seller&apos;s sale separately.
      </p>
    </div>
  );
}
