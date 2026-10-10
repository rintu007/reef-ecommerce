import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import { LISTING_TYPE_ICONS, LISTING_TYPE_LABELS, type Listing } from "@reef-market/shared";
import { SaveButton } from "./SaveButton";

/**
 * Shared marketplace card (Browse, Home, Saved). `saved` undefined hides the
 * heart (signed-out viewers); `showStatus` surfaces non-active states on Saved.
 */
export function ListingCard({
  listing,
  saved,
  showStatus = false,
}: {
  listing: Listing;
  saved?: boolean;
  showStatus?: boolean;
}) {
  return (
    <Link href={`/listings/${listing.id}`} className="group relative block">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center text-5xl">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
        ) : (
          <span aria-hidden>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.featured && (
            <span className="bg-coral text-white text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1">
              Featured
            </span>
          )}
          {showStatus && listing.status !== "active" && (
            <span className="bg-white/90 backdrop-blur text-gray-800 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1">
              {listing.status.replace("_", " ")}
            </span>
          )}
        </div>

        {saved !== undefined && (
          <div className="absolute top-3 right-3">
            <SaveButton listingId={listing.id} initialSaved={saved} />
          </div>
        )}

        {listing.quantity > 0 && (
          <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-ink text-[11px] font-medium rounded-full px-2.5 py-1 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[var(--ease-out-expo)]">
            {listing.quantity} available
          </span>
        )}
      </div>

      <div className="pt-3 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 truncate">
            {LISTING_TYPE_LABELS[listing.listing_type]}
          </p>
          <div className="flex items-center gap-2 text-gray-400 shrink-0">
            {listing.local_pickup && <MapPin size={13} aria-label="Local pickup" />}
            {listing.shipping_available && <Truck size={13} aria-label="Ships" />}
          </div>
        </div>
        <h3 className="mt-1 text-[15px] font-medium text-ink leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
          {listing.title}
        </h3>
        <p className="mt-1 font-display text-2xl leading-none text-ink">${listing.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
