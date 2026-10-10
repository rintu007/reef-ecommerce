import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings, type ListingQueryParams } from "@/lib/server/listings";
import { listSavedListingIds } from "@/lib/server/watchlist";
import { ListingCard } from "@/components/ListingCard";
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

  const isSalt = market === "saltwater";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Marketplace · {total} live listing{total === 1 ? "" : "s"}</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] text-ink">
            {isSalt ? (
              <>
                Saltwater <em className="italic text-blue-600">&amp; reef</em>
              </>
            ) : (
              <>
                Freshwater <em className="italic text-emerald-700">&amp; planted</em>
              </>
            )}
          </h1>
          <p className="mt-3 text-gray-500 max-w-md">
            {isSalt
              ? "Corals, reef fish, inverts and equipment from fellow hobbyists."
              : "Fish, amphibians, plants and equipment from fellow hobbyists."}
          </p>
        </div>
        <nav className="inline-flex self-start lg:self-auto p-1 rounded-full bg-gray-900/[0.06]" aria-label="Market">
          {(
            [
              { value: "saltwater", label: "Saltwater", emoji: "🪸" },
              { value: "freshwater", label: "Freshwater", emoji: "🐟" },
            ] as const
          ).map((m) => (
            <Link
              key={m.value}
              href={`/browse?market=${m.value}`}
              aria-current={market === m.value ? "page" : undefined}
              className={`px-5 h-10 inline-flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-300 ${
                market === m.value ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
              }`}
            >
              <span aria-hidden>{m.emoji}</span> {m.label}
            </Link>
          ))}
        </nav>
      </header>

      <BrowseFilters market={market} />

      {listings.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-gray-300">
          <p className="font-display text-3xl text-ink mb-2">Nothing here — yet.</p>
          <p className="text-sm text-gray-500">No listings match these filters. Try widening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
          {listings.map((listing, i) => (
            <div key={listing.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
              <ListingCard listing={listing} saved={user ? savedSet.has(listing.id) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
