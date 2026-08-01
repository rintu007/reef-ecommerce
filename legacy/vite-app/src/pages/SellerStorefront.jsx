import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MessageCircle, ShoppingCart, Check, Store, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { formatPrice } from "@/lib/currencies";
import { LISTING_TYPE_ICONS } from "@/lib/categories";

const CartCheckoutModal = lazy(() => import("@/components/payments/CartCheckoutModal"));

const PLACEHOLDER = "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80";

export default function SellerStorefront() {
  const { email: sellerEmailParam } = useParams();
  const sellerEmail = decodeURIComponent(sellerEmailParam);
  const navigate = useNavigate();
  const { isGuest, navigateToLogin } = useAuth();
  const [me, setMe] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
  }, []);

  const { data: sellerUsers = [] } = useQuery({
    queryKey: ["seller-profile", sellerEmail],
    queryFn: () => base44.entities.User.filter({ email: sellerEmail }),
    enabled: !!sellerEmail && !!me,
  });
  const seller = sellerUsers[0];

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["seller-listings", sellerEmail],
    queryFn: () => base44.entities.Listing.filter({ seller_email: sellerEmail, status: "active" }),
    enabled: !!sellerEmail,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["seller-reviews", sellerEmail],
    queryFn: () => base44.entities.Review.filter({ seller_email: sellerEmail }),
    enabled: !!sellerEmail && !!me,
  });

  const { data: completedOrders = [] } = useQuery({
    queryKey: ["seller-completed-orders", sellerEmail],
    queryFn: () => base44.entities.Order.filter({ seller_email: sellerEmail, status: "completed" }),
    enabled: !!sellerEmail && !!me,
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const toggleSelect = (listing) => {
    if (me?.email === sellerEmail) return; // sellers can't buy their own
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(listing.id)) {
        next.delete(listing.id);
      } else {
        next.add(listing.id);
      }
      return next;
    });
  };

  const selectedListings = listings.filter(l => selectedIds.has(l.id));
  const cartTotal = selectedListings.reduce((sum, l) => sum + (l.price || 0), 0);
  const isSelf = me?.email === sellerEmail;

  const handleCheckoutClick = () => {
    if (isGuest || !me) {
      navigateToLogin();
      return;
    }
    setShowCart(true);
  };

  const displayName = seller?.display_name || seller?.full_name || listings[0]?.seller_name || "Seller";

  const TYPE_LABELS = {
    coral: "Coral",
    fish: "Fish",
    sw_invert: "Inverts",
    equipment: "Equipment",
    fw_fish: "FW Fish",
    fw_amphibian: "Amphibians",
    fw_turtle: "Turtles",
    fw_other: "FW Other",
    fw_equipment: "FW Equip",
  };

  const availableTypes = ["all", ...Object.keys(TYPE_LABELS).filter(t => listings.some(l => l.listing_type === t))];
  const [activeTab, setActiveTab] = useState("all");
  const filteredListings = activeTab === "all" ? listings : listings.filter(l => l.listing_type === activeTab);

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {seller?.logo_url ? (
            <img src={seller.logo_url} alt="logo" className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
            </div>
          )}
          <span className="font-bold text-sm truncate">{displayName}</span>
        </div>
        {!isSelf && me && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-8 text-xs shrink-0"
            onClick={() => navigate(`/messages?to=${sellerEmail}`)}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
          </Button>
        )}
      </div>

      {/* Seller Banner */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border px-4 py-6">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border shrink-0 shadow-md">
            {seller?.logo_url ? (
              <img src={seller.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-primary">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-foreground leading-tight">{displayName}</h1>
              {seller?.verified_seller && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5 fill-primary text-primary-foreground" />
                  <span className="text-[10px] font-bold">Verified</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Store className="w-3.5 h-3.5" />
                <span>{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {completedOrders.length} sold
              </div>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">{avgRating}</span>
                  <span className="text-muted-foreground">({reviews.length})</span>
                </div>
              )}
            </div>

            {seller?.about && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{seller.about}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {availableTypes.length > 1 && (
        <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto no-scrollbar">
          {availableTypes.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeTab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground bg-card"
              }`}
            >
              {t === "all" ? `All (${listings.length})` : `${LISTING_TYPE_ICONS[t] || ""} ${TYPE_LABELS[t]} (${listings.filter(l => l.listing_type === t).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Selection hint */}
      {!isSelf && listings.length > 0 && (
        <div className="px-4 pt-2 pb-1">
          <p className="text-xs text-muted-foreground">Tap a listing to view details. Use the circle in the top-right to add multiple items to your cart.</p>
        </div>
      )}

      {/* Listings Grid */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active listings right now.</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-sm">No listings in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map(listing => {
              const selected = selectedIds.has(listing.id);
              const soldOut = (listing.quantity || 0) <= 0;
              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className={`relative bg-card border-2 rounded-2xl overflow-hidden text-left transition-all cursor-pointer ${
                    selected
                      ? "border-primary shadow-md shadow-primary/20"
                      : "border-border hover:border-primary/40"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  {/* Select toggle button */}
                  {!isSelf && !soldOut && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(listing); }}
                      className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow transition-all ${
                        selected ? "bg-primary border-primary" : "bg-white/80 border-border"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )}

                  {/* Sold out overlay */}
                  {soldOut && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-2xl">
                      <Badge className="bg-destructive text-white text-xs">Sold Out</Badge>
                    </div>
                  )}

                  <div className="aspect-square bg-muted overflow-hidden">
                    <img
                      src={listing.photos?.[0] || PLACEHOLDER}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold line-clamp-2 leading-tight mb-1">{listing.title}</p>
                    <p className="text-primary font-bold text-sm">{formatPrice(listing.price, listing.currency)}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {LISTING_TYPE_ICONS[listing.listing_type]} {listing.listing_type?.replace(/_/g, " ")}
                      </span>
                      {listing.shipping_available && (
                        <span className="text-[10px] text-emerald-600 font-medium">· Ships</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="px-4 pt-6 pb-4">
          <h2 className="font-bold text-sm mb-3">Reviews ({reviews.length})</h2>
          <div className="space-y-2">
            {reviews.slice(0, 5).map(r => (
              <div key={r.id} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">{r.reviewer_name || "Buyer"}</span>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky cart bar */}
      {selectedIds.size > 0 && !isSelf && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border px-4 py-3 z-40 shadow-xl">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold">{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected</p>
              <p className="text-xs text-muted-foreground">Total: {formatPrice(cartTotal, "USD")}</p>
            </div>
            <Button
              className="h-11 px-6 rounded-xl font-bold gap-2"
              onClick={handleCheckoutClick}
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout
            </Button>
          </div>
        </div>
      )}

      {showCart && (
        <Suspense fallback={null}>
          <CartCheckoutModal
            listings={selectedListings}
            sellerEmail={sellerEmail}
            onClose={() => setShowCart(false)}
            onSuccess={() => {
              setShowCart(false);
              setSelectedIds(new Set());
              navigate("/orders");
            }}
          />
        </Suspense>
      )}
    </div>
  );
}