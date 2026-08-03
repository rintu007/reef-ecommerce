import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getListingById } from "@/lib/server/listings";
import { getPublicProfile } from "@/lib/server/profiles";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const listing = await getListingById(id, user);
  if (!listing) notFound();

  const seller = await getPublicProfile(listing.seller_id);

  const backMarket = listing.market === "freshwater" ? "freshwater" : "saltwater";

  return (
    <div className="min-h-screen max-w-3xl mx-auto p-6">
      <Link href={`/browse?market=${backMarket}`} className="text-sm text-blue-600 hover:underline">
        ← Back to Browse
      </Link>

      <div className="mt-4 grid sm:grid-cols-2 gap-6">
        <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-6xl overflow-hidden">
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500">
            {LISTING_TYPE_LABELS[listing.listing_type]}
            {listing.category ? ` · ${listing.category}` : ""}
          </p>
          <h1 className="text-2xl font-bold mt-1">{listing.title}</h1>
          <p className="text-2xl font-bold text-blue-600 mt-2">${listing.price.toFixed(2)}</p>

          {listing.description && (
            <p className="mt-4 text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
            {listing.location && (
              <>
                <dt className="text-gray-500">Location</dt>
                <dd>{listing.location}</dd>
              </>
            )}
            <dt className="text-gray-500">Quantity available</dt>
            <dd>{listing.quantity}</dd>
            <dt className="text-gray-500">Shipping</dt>
            <dd>{listing.shipping_available ? "Available" : "Not offered"}</dd>
            <dt className="text-gray-500">Local pickup</dt>
            <dd>{listing.local_pickup ? "Yes" : "No"}</dd>
          </dl>

          {listing.status !== "active" && (
            <p className="mt-4 inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
              Status: {listing.status}
            </p>
          )}

          {seller && (
            <Link
              href={`/sellers/${seller.id}`}
              className="mt-6 flex items-center gap-2 text-sm hover:underline w-fit"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm overflow-hidden">
                {seller.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  "👤"
                )}
              </div>
              <span className="font-semibold">{seller.display_name ?? "Reef Market User"}</span>
              {seller.verified_seller && <span className="text-emerald-600">✓</span>}
            </Link>
          )}

          {user && user.id !== listing.seller_id && (
            <Link
              href={`/messages/new?to=${listing.seller_id}&listing=${listing.id}`}
              className="mt-6 inline-block px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Message Seller
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
