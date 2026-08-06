"use client";

import { useState } from "react";
import type { Listing } from "@reef-market/shared";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({ listing }: { listing: Listing }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      listingId: listing.id,
      quantity: listing.min_qty,
      shippingMethod: listing.shipping_available ? "shipping" : "local_pickup",
      pickupTime: listing.pickup_times[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className="px-5 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
