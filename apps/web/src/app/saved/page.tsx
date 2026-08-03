import Link from "next/link";
import { redirect } from "next/navigation";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listSavedListings } from "@/lib/server/watchlist";
import { SaveButton } from "@/components/SaveButton";

export default async function SavedListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const listings = await listSavedListings(user.id);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Listings</h1>

      {listings.length === 0 ? (
        <p className="text-gray-500 text-center py-24">
          Nothing saved yet.{" "}
          <Link href="/browse" className="text-blue-600 hover:underline">
            Browse listings
          </Link>{" "}
          and tap the heart to save them here.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="relative rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <SaveButton listingId={listing.id} initialSaved={true} />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500">{LISTING_TYPE_LABELS[listing.listing_type]}</p>
                <p className="font-semibold text-sm truncate">{listing.title}</p>
                <p className="text-sm font-bold">${listing.price.toFixed(2)}</p>
                {listing.status !== "active" && (
                  <p className="text-xs text-yellow-700 mt-1">{listing.status.replace("_", " ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
