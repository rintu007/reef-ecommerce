import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTING_TYPE_ICONS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";
import { getPublicProfile } from "@/lib/server/profiles";

export default async function SellerStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const viewer = await getAuthenticatedUser();
  const { listings } = await queryListings({ sellerId: id, status: "active", sort: "newest", limit: 48 }, viewer);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl overflow-hidden shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.display_name ?? "Reef Market User"}</h1>
            {profile.verified_seller && (
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                ✓ Verified Seller
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {[profile.location, profile.country].filter(Boolean).join(", ")}
            {profile.location || profile.country ? " · " : ""}
            {profile.completed_sales_count} completed sales
          </p>
          {viewer && viewer.id !== profile.id && (
            <Link
              href={`/messages/new?to=${profile.id}`}
              className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Message
            </Link>
          )}
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-gray-700 whitespace-pre-wrap">{profile.bio}</p>}

      <h2 className="text-lg font-bold mt-8 mb-4">Active Listings</h2>
      {listings.length === 0 ? (
        <p className="text-gray-500">No active listings.</p>
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
