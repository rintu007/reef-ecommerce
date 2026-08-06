import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTING_TYPE_ICONS, type DoaPolicyType, type Listing } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getListingById } from "@/lib/server/listings";
import { getPublicProfile } from "@/lib/server/profiles";
import { listReviewsForSeller } from "@/lib/server/reviews";
import { listSavedListingIds } from "@/lib/server/watchlist";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ReportBlockButton } from "@/components/ReportBlockButton";
import { SaveButton } from "@/components/SaveButton";
import { PhotoGallery } from "./PhotoGallery";

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80";

const DOA_POLICY_COPY: Record<
  Exclude<DoaPolicyType, "not_applicable">,
  { icon: string; color: string; bg: string; border: string; label: string; text: (listing: Listing) => string }
> = {
  full_refund: {
    icon: "🔄",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Full Refund Policy",
    text: () =>
      "Seller offers a full refund if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag.",
  },
  store_credit: {
    icon: "📜",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Store Credit Policy",
    text: () =>
      "Seller offers store credit if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag.",
  },
  no_refund: {
    icon: "📦",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "No Refunds — Buyer's Risk",
    text: () => "This item is shipped at the buyer's risk. No refunds or credits are offered for DOA.",
  },
  custom: {
    icon: "⚠️",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Seller's Arrival Policy",
    text: (listing) => listing.doa_policy_custom ?? "",
  },
};

function getShippingLabel(listing: Listing): string {
  const tiers = [...listing.shipping_tiers].sort((a, b) => a.up_to_qty - b.up_to_qty);
  if (tiers.length > 0) {
    const minPrice = Math.min(...tiers.map((t) => t.price));
    return minPrice === 0 ? "free" : `from $${minPrice.toFixed(2)}`;
  }
  if (listing.shipping_cost > 0) return `$${listing.shipping_cost.toFixed(2)}`;
  return "included";
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const listing = await getListingById(id, user);
  if (!listing) notFound();

  const [seller, savedIds, reviews] = await Promise.all([
    getPublicProfile(listing.seller_id),
    user ? listSavedListingIds(user.id) : Promise.resolve<string[]>([]),
    listReviewsForSeller(listing.seller_id),
  ]);
  const isSaved = savedIds.includes(listing.id);
  const isSeller = user?.id === listing.seller_id;

  const backMarket = listing.market === "freshwater" ? "freshwater" : "saltwater";
  const photos = listing.photos.length ? listing.photos : [PLACEHOLDER_PHOTO];

  const doaPolicy =
    listing.shipping_available && listing.doa_policy && listing.doa_policy !== "not_applicable"
      ? DOA_POLICY_COPY[listing.doa_policy]
      : null;

  const isOutOfStock = listing.status !== "active" || listing.quantity <= 0;
  const buyDisabled = isOutOfStock || isSeller;
  const canAddToCart = !!user && !isSeller && listing.status === "active" && listing.quantity > 0;

  return (
    <div className="pb-28">
      <div className="max-w-3xl mx-auto">
        {/* Photo gallery */}
        <div className="relative aspect-square bg-gray-100 sm:rounded-xl sm:mt-6 overflow-hidden">
          <PhotoGallery photos={photos} title={listing.title} />
          <Link
            href={`/browse?market=${backMarket}`}
            aria-label="Back to Browse"
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white text-lg hover:bg-black/50 transition-colors"
          >
            ←
          </Link>
          {user && (
            <div className="absolute top-4 right-4 flex gap-2">
              <SaveButton
                listingId={listing.id}
                initialSaved={isSaved}
                className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-base text-white hover:bg-black/50 transition-colors"
              />
              {!isSeller && (
                <ReportBlockButton
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerId={listing.seller_id}
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-base text-white hover:bg-black/50 transition-colors"
                />
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-0 pt-4 space-y-4">
          {/* Title & price */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold leading-tight flex-1">{listing.title}</h1>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-blue-600">${listing.price.toFixed(2)}</p>
                {listing.pickup_price != null && listing.shipping_available && listing.local_pickup && (
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">📍 Pickup: ${listing.pickup_price.toFixed(2)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {LISTING_TYPE_ICONS[listing.listing_type]} {listing.category}
              </span>
              {listing.wysiwyg && (
                <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">WYSIWYG</span>
              )}
              {listing.difficulty && (
                <span className="inline-block px-2.5 py-1 rounded-full border border-gray-300 text-xs capitalize">
                  {listing.difficulty}
                </span>
              )}
            </div>
          </div>

          {/* Shipping & stock */}
          <div className="flex gap-3 items-center flex-wrap text-sm text-gray-600">
            {listing.local_pickup && (
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                {listing.pickup_price != null && listing.shipping_available ? (
                  <span>
                    Pickup <span className="font-semibold text-emerald-600">${listing.pickup_price.toFixed(2)}</span>
                  </span>
                ) : (
                  <span>Local pickup</span>
                )}
              </div>
            )}
            {listing.shipping_available && (
              <div className="flex items-center gap-1.5">
                <span>🚚</span>
                <span>
                  Shipping <span className="font-semibold text-gray-900">{getShippingLabel(listing)}</span>
                </span>
              </div>
            )}
            {listing.quantity > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-full border border-gray-300 text-xs">
                {listing.quantity} in stock
              </span>
            )}
            {listing.min_qty > 1 && (
              <span className="inline-block px-2.5 py-1 rounded-full border border-amber-400 text-amber-600 text-xs">
                Min qty: {listing.min_qty}
              </span>
            )}
            {listing.min_order_amount > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-full border border-amber-400 text-amber-600 text-xs">
                Min order: ${listing.min_order_amount.toFixed(2)}
              </span>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Type-specific spec card */}
          {listing.listing_type === "coral" &&
            (listing.light_requirement || listing.flow_requirement || listing.difficulty) && (
              <div className="grid grid-cols-3 gap-3">
                {listing.light_requirement && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg">☀️</p>
                    <p className="text-[10px] text-gray-500">Light</p>
                    <p className="text-xs font-semibold capitalize">{listing.light_requirement}</p>
                  </div>
                )}
                {listing.flow_requirement && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg">💨</p>
                    <p className="text-[10px] text-gray-500">Flow</p>
                    <p className="text-xs font-semibold capitalize">{listing.flow_requirement}</p>
                  </div>
                )}
                {listing.difficulty && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg">📊</p>
                    <p className="text-[10px] text-gray-500">Difficulty</p>
                    <p className="text-xs font-semibold capitalize">{listing.difficulty}</p>
                  </div>
                )}
              </div>
            )}

          {listing.listing_type === "fish" &&
            (listing.temperament || listing.tank_size_recommendation || listing.reef_safe !== null) && (
              <div className="space-y-2">
                {(listing.temperament || listing.tank_size_recommendation) && (
                  <div className="grid grid-cols-2 gap-3">
                    {listing.temperament && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-500">Temperament</p>
                        <p className="text-sm font-semibold capitalize">{listing.temperament}</p>
                      </div>
                    )}
                    {listing.tank_size_recommendation && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-500">Min Tank Size</p>
                        <p className="text-sm font-semibold">{listing.tank_size_recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
                {listing.reef_safe !== null && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <span>{listing.reef_safe ? "🛡️" : "🚫"}</span>
                    <p className="text-sm font-semibold">{listing.reef_safe ? "Reef Safe" : "Not Reef Safe"}</p>
                  </div>
                )}
              </div>
            )}

          {(listing.listing_type === "equipment" || listing.listing_type === "fw_equipment") &&
            (listing.brand || listing.model || listing.condition) && (
              <div className="space-y-2">
                {listing.brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium">{listing.brand}</span>
                  </div>
                )}
                {listing.model && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model</span>
                    <span className="font-medium">{listing.model}</span>
                  </div>
                )}
                {listing.condition && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Condition</span>
                    <span className="font-medium capitalize">{listing.condition.replace("_", " ")}</span>
                  </div>
                )}
              </div>
            )}

          {listing.description && (
            <div>
              <h2 className="font-semibold text-sm mb-1">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {listing.care_notes && (
            <div>
              <h2 className="font-semibold text-sm mb-1">Care Notes</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.care_notes}</p>
            </div>
          )}

          {doaPolicy && (
            <div className={`rounded-xl border px-4 py-3 ${doaPolicy.bg} ${doaPolicy.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{doaPolicy.icon}</span>
                <span className={`text-sm font-semibold ${doaPolicy.color}`}>{doaPolicy.label}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{doaPolicy.text(listing)}</p>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* Seller card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Link href={`/sellers/${listing.seller_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center shrink-0">
                  {seller?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-blue-600">{(seller?.display_name ?? "S")[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {seller?.display_name ?? "Reef Market User"}
                    {seller?.verified_seller ? " ✓" : ""}
                  </p>
                  <p className="text-[10px] text-gray-500">Member seller</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/sellers/${listing.seller_id}`}
                  className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  🏪 Store
                </Link>
                {user && !isSeller && (
                  <Link
                    href={`/messages/new?to=${listing.seller_id}&listing=${listing.id}`}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    💬 Message
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold">{seller?.completed_sales_count ?? 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Completed Sales</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                {reviews.averageRating ? (
                  <>
                    <p className="text-xl font-extrabold">
                      {reviews.averageRating.toFixed(1)} <span className="text-amber-500">⭐</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {reviews.count} review{reviews.count !== 1 ? "s" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-gray-400">—</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">No reviews yet</p>
                  </>
                )}
              </div>
            </div>

            {seller?.bio && (
              <div className="bg-white rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">About the Seller</p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{seller.bio}</p>
              </div>
            )}

            {reviews.reviews.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= Math.round(reviews.averageRating ?? 0) ? "text-amber-500" : "text-gray-300"}>
                      ⭐
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{reviews.averageRating?.toFixed(1)} out of 5</span>
                </div>
                <div className="space-y-2">
                  {reviews.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-xs ${s <= review.rating ? "text-amber-500" : "text-gray-300"}`}>
                            ⭐
                          </span>
                        ))}
                        <span className="text-[10px] text-gray-500 ml-1">{review.reviewer?.display_name ?? "Buyer"}</span>
                      </div>
                      {review.comment && <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-3xl mx-auto flex gap-3 items-center">
          <Link
            href={`/sellers/${listing.seller_id}`}
            className="h-12 px-4 rounded-xl border border-gray-300 font-bold text-sm flex items-center gap-1.5 shrink-0 hover:bg-gray-50 transition-colors"
          >
            🏪 Store
          </Link>
          {canAddToCart && <AddToCartButton listing={listing} />}
          {buyDisabled ? (
            <button
              type="button"
              disabled
              className="flex-1 h-12 rounded-xl text-base font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              {isOutOfStock ? "Out of Stock" : "Your Listing"}
            </button>
          ) : (
            <Link
              href={`/listings/${listing.id}/checkout`}
              className="flex-1 h-12 rounded-xl text-base font-bold bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              🛍️ Buy Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
