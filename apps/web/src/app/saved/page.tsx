import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listSavedListings } from "@/lib/server/watchlist";
import { ListingCard } from "@/components/ListingCard";

export default async function SavedListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const listings = await listSavedListings(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10">
      <header className="mb-10 animate-rise">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">
          Your watchlist · {listings.length} saved
        </p>
        <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] text-ink">
          Saved <em className="italic text-blue-600">listings</em>
        </h1>
      </header>

      {listings.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-gray-300">
          <p className="font-display text-3xl text-ink mb-2">Nothing saved yet.</p>
          <p className="text-sm text-gray-500">
            <Link href="/browse" className="text-blue-600 hover:underline">
              Browse listings
            </Link>{" "}
            and tap the heart to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} saved showStatus />
          ))}
        </div>
      )}
    </div>
  );
}
