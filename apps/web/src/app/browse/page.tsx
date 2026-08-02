import Link from "next/link";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";

type Market = "saltwater" | "freshwater";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const sp = await searchParams;
  const market: Market = sp.market === "freshwater" ? "freshwater" : "saltwater";

  const user = await getAuthenticatedUser();
  const { listings, total } = await queryListings({ market, limit: 24, sort: "newest" }, user);

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

      <p className="text-sm text-gray-500 mb-4">
        {total} listing{total === 1 ? "" : "s"}
      </p>

      {listings.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-1">No listings yet</p>
          <p className="text-sm">Be the first to list something in this market.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500">{LISTING_TYPE_LABELS[listing.listing_type]}</p>
                <p className="font-semibold text-sm truncate">{listing.title}</p>
                <p className="text-sm font-bold">${listing.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
