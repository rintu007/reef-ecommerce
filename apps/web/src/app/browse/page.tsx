import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings, type ListingQueryParams } from "@/lib/server/listings";
import { listSavedListingIds } from "@/lib/server/watchlist";
import { SaveButton } from "@/components/SaveButton";
import { BrowseFilters } from "./BrowseFilters";

type Market = "saltwater" | "freshwater";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const market: Market = sp.market === "freshwater" ? "freshwater" : "saltwater";

  const params: ListingQueryParams = {
    market,
    listingType: sp.listing_type || undefined,
    category: sp.category || undefined,
    q: sp.q || undefined,
    minPrice: sp.min_price ? Number(sp.min_price) : undefined,
    maxPrice: sp.max_price ? Number(sp.max_price) : undefined,
    shipping: sp.shipping === "local_pickup" || sp.shipping === "shipping" ? sp.shipping : undefined,
    sort: (sp.sort as ListingQueryParams["sort"]) || "newest",
    lat: sp.lat ? Number(sp.lat) : undefined,
    lng: sp.lng ? Number(sp.lng) : undefined,
    radiusMiles: sp.radius_miles ? Number(sp.radius_miles) : undefined,
    limit: 24,
  };

  const user = await getAuthenticatedUser();
  const [{ listings, total }, savedIds] = await Promise.all([
    queryListings(params, user),
    user ? listSavedListingIds(user.id) : Promise.resolve<string[]>([]),
  ]);
  const savedSet = new Set(savedIds);

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Browse</h1>
        <nav className="flex gap-2">
          <Link
            href="/browse?market=saltwater"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              market === "saltwater" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            🪸 Saltwater
          </Link>
          <Link
            href="/browse?market=freshwater"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              market === "freshwater" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            🐟 Freshwater
          </Link>
        </nav>
      </header>

      <BrowseFilters market={market} />

      <p className="text-sm text-gray-500 mb-4">
        {total} listing{total === 1 ? "" : "s"}
      </p>

      {listings.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-1">No listings match your filters</p>
          <p className="text-sm">Try widening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="relative rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl relative">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
                )}
                {listing.featured && (
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                    Featured
                  </span>
                )}
              </div>
              {user && (
                <div className="absolute top-2 right-2">
                  <SaveButton listingId={listing.id} initialSaved={savedSet.has(listing.id)} />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs text-gray-500">{LISTING_TYPE_LABELS[listing.listing_type]}</p>
                <p className="font-semibold text-sm truncate">{listing.title}</p>
                <p className="text-sm font-bold">${listing.price.toFixed(2)}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {listing.quantity > 0 && <span className="text-[11px] font-semibold text-gray-900">{listing.quantity} available</span>}
                  {listing.local_pickup && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <MapPin size={11} /> Local
                    </span>
                  )}
                  {listing.shipping_available && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Truck size={11} /> Ships
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
