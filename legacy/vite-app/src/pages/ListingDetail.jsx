import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, Truck, Star, Share2, Flag, MessageCircle,
  ShoppingBag, ChevronLeft, ChevronRight, Droplets, Sun, Wind, Gauge, Shield, AlertTriangle, RefreshCw, PackageX, ScrollText, Store
} from "lucide-react";
import { LISTING_TYPE_ICONS } from "@/lib/categories";
import { toast } from "sonner";
import CheckoutModal from "@/components/payments/CheckoutModal";
import ReportBlockSheet from "@/components/moderation/ReportBlockSheet";
import OrderReceiptModal from "@/components/payments/OrderReceiptModal";
import { useAuth } from "@/lib/AuthContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80";

function getShippingLabel(listing) {
  const tiers = (listing.shipping_tiers || []).slice().sort((a, b) => a.up_to_qty - b.up_to_qty);
  if (tiers.length > 0) {
    const minPrice = Math.min(...tiers.map(t => t.price));
    return minPrice === 0 ? "free" : `from $${minPrice.toFixed(2)}`;
  }
  if (listing.shipping_cost > 0) return `$${listing.shipping_cost.toFixed(2)}`;
  return "included";
}

export default function ListingDetail() {
  const navigate = useNavigate();
  const { isGuest, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const listingId = window.location.pathname.split("/listing/")[1];
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId, isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke("getPublicListings", { filter: { id: listingId }, limit: 1 });
        return res.data?.listings?.[0];
      }
      const items = await base44.entities.Listing.filter({ id: listingId });
      return items[0];
    },
    enabled: !!listingId,
  });

  const [me, setMe] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showReportBlock, setShowReportBlock] = useState(false);
  const [blockedSellers, setBlockedSellers] = useState([]);
  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", listing?.seller_email],
    queryFn: () => base44.entities.Review.filter({ seller_email: listing.seller_email }),
    enabled: !!listing?.seller_email && !isGuest && !!me,
  });

  const { data: sellerSales = [] } = useQuery({
    queryKey: ["seller-sales", listing?.seller_email],
    queryFn: () => base44.entities.Order.filter({ seller_email: listing.seller_email, status: "completed" }),
    enabled: !!listing?.seller_email && !isGuest && !!me,
  });

  const { data: sellerUsers = [] } = useQuery({
    queryKey: ["seller-user", listing?.seller_email],
    queryFn: () => base44.entities.User.filter({ email: listing.seller_email }),
    enabled: !!listing?.seller_email && !isGuest && !!me,
  });
  const sellerProfile = sellerUsers[0];

  if (isLoading || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const photos = listing.photos?.length ? listing.photos : [PLACEHOLDER];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="pb-24">
      {/* Photo gallery */}
      <div className="relative aspect-square bg-muted">
        <motion.img
          layoutId={photoIndex === 0 ? `listing-photo-${listing.id}` : undefined}
          src={photos[photoIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {me && me.email !== listing.seller_email && (
          <button onClick={() => setShowReportBlock(true)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
            <Flag className="w-4 h-4 text-white" />
          </button>
        )}
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {/* Title & price */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-foreground leading-tight">{listing.title}</h1>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-primary">${listing.price?.toFixed(2)}</p>
              {listing.pickup_price != null && listing.shipping_available && listing.local_pickup && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  📍 Pickup: ${listing.pickup_price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {LISTING_TYPE_ICONS[listing.listing_type]} {listing.category}
            </Badge>
            {listing.wysiwyg && <Badge className="bg-primary/10 text-primary text-xs">WYSIWYG</Badge>}
            {listing.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">{listing.difficulty}</Badge>
            )}
          </div>
        </div>

        {/* Shipping & Stock */}
        <div className="flex gap-3 items-center flex-wrap">
          {listing.local_pickup && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {listing.pickup_price != null && listing.shipping_available
                ? <span>Pickup <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${listing.pickup_price.toFixed(2)}</span></span>
                : "Local pickup"
              }
            </div>
          )}
          {listing.shipping_available && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>
                Shipping{" "}
                <span className="font-semibold text-foreground">{getShippingLabel(listing)}</span>
              </span>
            </div>
          )}
          {listing.quantity && listing.quantity > 0 && (
            <Badge variant="outline" className="text-xs">
              {listing.quantity} in stock
            </Badge>
          )}
          {listing.min_qty > 1 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
              Min. qty: {listing.min_qty}
            </Badge>
          )}
          {listing.min_order_amount > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
              Min. order: ${listing.min_order_amount.toFixed(2)}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Coral details */}
        {listing.listing_type === "coral" && (
          <div className="grid grid-cols-3 gap-3">
            {listing.light_requirement && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Sun className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Light</p>
                <p className="text-xs font-semibold capitalize">{listing.light_requirement}</p>
              </div>
            )}
            {listing.flow_requirement && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Wind className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Flow</p>
                <p className="text-xs font-semibold capitalize">{listing.flow_requirement}</p>
              </div>
            )}
            {listing.difficulty && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Gauge className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Difficulty</p>
                <p className="text-xs font-semibold capitalize">{listing.difficulty}</p>
              </div>
            )}
          </div>
        )}

        {/* Fish details */}
        {listing.listing_type === "fish" && (
          <div className="grid grid-cols-2 gap-3">
            {listing.temperament && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">Temperament</p>
                <p className="text-sm font-semibold capitalize">{listing.temperament}</p>
              </div>
            )}
            {listing.tank_size_recommendation && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">Min Tank Size</p>
                <p className="text-sm font-semibold">{listing.tank_size_recommendation}</p>
              </div>
            )}
            {listing.reef_safe !== undefined && (
              <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                <Shield className={`w-4 h-4 ${listing.reef_safe ? "text-emerald-500" : "text-destructive"}`} />
                <p className="text-sm font-semibold">{listing.reef_safe ? "Reef Safe" : "Not Reef Safe"}</p>
              </div>
            )}
          </div>
        )}

        {/* Equipment details */}
        {listing.listing_type === "equipment" && (
          <div className="space-y-2">
            {listing.brand && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Brand</span><span className="font-medium">{listing.brand}</span></div>}
            {listing.model && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Model</span><span className="font-medium">{listing.model}</span></div>}
            {listing.condition && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Condition</span><span className="font-medium capitalize">{listing.condition.replace("_", " ")}</span></div>}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          </div>
        )}

        {listing.care_notes && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Care Notes</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.care_notes}</p>
          </div>
        )}

        {/* DOA Policy — only for listings with shipping */}
        {listing.shipping_available && listing.doa_policy && (() => {
          const policyMap = {
            full_refund: { icon: RefreshCw, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", label: "Full Refund Policy", text: "Seller offers a full refund if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag." },
            store_credit: { icon: ScrollText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", label: "Store Credit Policy", text: "Seller offers store credit if the animal arrives dead. Photo proof required within 2 hours of delivery, item still in sealed bag." },
            no_refund: { icon: PackageX, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", label: "No Refunds — Buyer's Risk", text: "This item is shipped at the buyer's risk. No refunds or credits are offered for DOA." },
            custom: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", label: "Seller's Arrival Policy", text: listing.doa_policy_custom },
            not_applicable: null,
          };
          const p = policyMap[listing.doa_policy];
          if (!p) return null;
          const Icon = p.icon;
          return (
            <div className={`rounded-xl border px-4 py-3 ${p.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${p.color}`} />
                <span className={`text-sm font-semibold ${p.color}`}>{p.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          );
        })()}

        <Separator />

        {/* Seller card */}
        <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {sellerProfile?.logo_url ? (
                  <img src={sellerProfile.logo_url} alt="seller" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">{(listing.seller_name || "S")[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{listing.seller_name || "Seller"}</p>
                <p className="text-[10px] text-muted-foreground">Member seller</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" onClick={() => navigate(`/seller/${encodeURIComponent(listing.seller_email)}`)}>
                <Store className="w-3.5 h-3.5 mr-1" /> Store
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" onClick={() => navigate(`/messages?to=${listing.seller_email}&listing=${listing.id}`)}>
                <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sales */}
            <div className="bg-card rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-foreground">{sellerSales.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Completed Sales</p>
            </div>
            {/* Rating */}
            <div className="bg-card rounded-xl p-3 text-center">
              {avgRating ? (
                <>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl font-extrabold text-foreground">{avgRating}</p>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-extrabold text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No reviews yet</p>
                </>
              )}
            </div>
          </div>

          {/* About bio */}
          {sellerProfile?.about && (
            <div className="bg-card rounded-xl p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">About the Seller</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{sellerProfile.about}</p>
            </div>
          )}

          {/* Star breakdown & recent reviews */}
          {reviews.length > 0 && (
            <div className="space-y-2">
              {/* Visual star rating */}
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{avgRating} out of 5</span>
              </div>
              {/* Recent reviews */}
              <div className="space-y-2 pt-1">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="bg-card rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">{r.reviewer_name || "Buyer"}</span>
                    </div>
                    {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            className="h-12 px-4 rounded-xl font-bold shrink-0 gap-1.5"
            onClick={() => navigate(`/seller/${encodeURIComponent(listing.seller_email)}`)}
          >
            <Store className="w-4 h-4" />
            <span className="text-sm">View Store</span>
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90"
            onClick={() => setShowCheckout(true)}
            disabled={listing.status === "sold" || (!isGuest && me?.email === listing.seller_email) || (listing.quantity || 0) <= 0}
          >
            {listing.status === "sold" || (listing.quantity || 0) <= 0 ? "Out of Stock" : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2" />
                Buy Now
              </>
            )}
          </Button>
        </div>
      </div>

      {showReportBlock && (
        <ReportBlockSheet
          listing={listing}
          onClose={() => setShowReportBlock(false)}
          onBlocked={(email) => { setShowReportBlock(false); navigate(-1); }}
        />
      )}
      {showCheckout && !receipt && (
        <CheckoutModal
          listing={listing}
          onClose={() => setShowCheckout(false)}
          onSuccess={(pickupTime, breakdown) => {
            setShowCheckout(false);
            setReceipt({ listing, pickupTime, breakdown });
          }}
        />
      )}
      {receipt && (
        <OrderReceiptModal
          order={receipt}
          listing={listing}
          onClose={() => { setReceipt(null); navigate("/orders"); }}
        />
      )}
    </div>
  );
}