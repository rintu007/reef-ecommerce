import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  sold: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  removed: "bg-gray-200 text-gray-700",
};

export default async function MyListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const { listings } = await queryListings({ sellerId: user.id, sort: "newest", limit: 200 }, user);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/sell/fee-calculator"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Fee Calculator
          </Link>
          <Link
            href="/sell"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-500 text-center py-16">You haven&apos;t created any listings yet.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-3 bg-white"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  "🪸"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/listings/${listing.id}`} className="font-semibold text-sm hover:underline truncate block">
                  {listing.title}
                </Link>
                <p className="text-sm text-gray-500">${listing.price.toFixed(2)}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {listing.status.replace("_", " ")}
              </span>
              <div className="flex gap-3 shrink-0">
                <Link href={`/listings/${listing.id}/edit`} className="text-sm font-semibold text-blue-600 hover:underline">
                  Edit
                </Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
