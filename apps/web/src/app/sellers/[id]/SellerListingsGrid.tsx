"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS, type Listing } from "@reef-market/shared";
import { useCart } from "@/lib/cart-context";

export function SellerListingsGrid({ listings, canSelect }: { listings: Listing[]; canSelect: boolean }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(listings.map((l) => l.listing_type)));
    return ["all", ...types];
  }, [listings]);

  const filteredListings = activeTab === "all" ? listings : listings.filter((l) => l.listing_type === activeTab);

  function toggleSelect(listing: Listing) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listing.id)) next.delete(listing.id);
      else next.add(listing.id);
      return next;
    });
  }

  const selectedListings = listings.filter((l) => selectedIds.has(l.id));
  const cartTotal = selectedListings.reduce((sum, l) => sum + l.price, 0);

  function handleAddToCart() {
    for (const listing of selectedListings) {
      addItem({
        listingId: listing.id,
        quantity: listing.min_qty,
        shippingMethod: listing.shipping_available ? "shipping" : "local_pickup",
        pickupTime: listing.pickup_times[0],
      });
    }
    router.push("/cart");
  }

  if (listings.length === 0) {
    return <p className="text-gray-500">No active listings.</p>;
  }

  return (
    <div className={selectedIds.size > 0 ? "pb-20" : ""}>
      {availableTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
          {availableTypes.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeTab === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 bg-white"
              }`}
            >
              {t === "all"
                ? `All (${listings.length})`
                : `${LISTING_TYPE_ICONS[t as keyof typeof LISTING_TYPE_ICONS]} ${LISTING_TYPE_LABELS[t as keyof typeof LISTING_TYPE_LABELS]} (${listings.filter((l) => l.listing_type === t).length})`}
            </button>
          ))}
        </div>
      )}

      {canSelect && (
        <p className="text-xs text-gray-400 mb-3">
          Tap the circle on a listing to select multiple items and check out together.
        </p>
      )}

      {filteredListings.length === 0 ? (
        <p className="text-gray-500">No listings in this category.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredListings.map((listing) => {
            const selected = selectedIds.has(listing.id);
            const soldOut = listing.quantity <= 0;
            return (
              <div
                key={listing.id}
                className={`relative rounded-xl border overflow-hidden bg-white transition-shadow ${
                  selected ? "border-blue-600 shadow-md" : "border-gray-200 hover:shadow-md"
                } ${soldOut ? "opacity-60" : ""}`}
              >
                {canSelect && !soldOut && (
                  <button
                    onClick={() => toggleSelect(listing)}
                    aria-label={selected ? "Deselect listing" : "Select listing"}
                    data-testid={`select-listing-${listing.id}`}
                    className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow ${
                      selected ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-gray-300"
                    }`}
                  >
                    {selected && "✓"}
                  </button>
                )}
                <Link href={`/listings/${listing.id}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                    {listing.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{listing.title}</p>
                    <p className="text-sm font-bold">${listing.price.toFixed(2)}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-xl">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-gray-500">Total: ${cartTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
