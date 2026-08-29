import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { LISTING_TYPE_ICONS } from "@/lib/categories";
import { formatPrice } from "@/lib/currencies";
import { useWatchlist } from "@/hooks/useWatchlist";

export default function ListingCard({ listing, className }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { savedIds, toggle } = useWatchlist();
  const isSaved = savedIds.has(listing.id);

  const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80";

  const { data: stats } = useQuery({
    queryKey: ["sellerStats", listing.seller_email],
    queryFn: () => base44.functions.invoke("getSellerStats", { sellerEmail: listing.seller_email }),
    enabled: !!listing.seller_email && isAuthenticated && !isLoadingAuth,
    staleTime: 1000 * 60 * 10,
  });

  const rating = stats?.data?.averageRating || 0;
  const totalReviews = stats?.data?.totalReviews || 0;

  return (
    <div className={cn("group relative", className)}>
      <Link
        to={`/listing/${listing.id}`}
        className="block rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {listing.featured && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-2">
              Featured
            </Badge>
          )}
          {listing.wysiwyg && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] px-2">
              WYSIWYG
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
            <p className="text-white font-bold text-lg leading-tight">{formatPrice(listing.price, listing.currency || "USD")}</p>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground truncate">{listing.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>{LISTING_TYPE_ICONS[listing.listing_type]}</span>
            <span className="truncate">{listing.category}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            {listing.quantity > 0 && (
              <span className="font-semibold text-foreground">{listing.quantity} available</span>
            )}
            {listing.local_pickup && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Local
              </span>
            )}
            {listing.shipping_available && (
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3" /> Ships
              </span>
            )}
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[11px]">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="font-semibold">{rating}</span>
              {totalReviews > 0 && <span className="text-muted-foreground">({totalReviews})</span>}
            </div>
          )}
        </div>
      </Link>
      {isAuthenticated && (
        <button
          onClick={(e) => { e.preventDefault(); toggle(listing.id, isSaved); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 transition-colors z-10"
        >
          <Heart className={cn("w-5 h-5 transition-all", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
      )}
    </div>
  );
}