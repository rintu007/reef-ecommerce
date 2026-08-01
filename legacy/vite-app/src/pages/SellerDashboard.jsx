import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Package, AlertCircle, Edit, Power, Eye, BadgeDollarSign, Loader2, ExternalLink, ChevronRight, Check, X, Camera, Store, Share2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import OrderDetailModal from "@/components/seller/OrderDetailModal";
import TankPhotos from "@/components/profile/TankPhotos";
import SellingCalculator from "@/components/seller/SellingCalculator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-destructive/10 text-destructive",
  doa_claim: "bg-destructive/10 text-destructive",
  awaiting_pickup: "bg-blue-100 text-blue-800",
  pickup_confirmed: "bg-emerald-100 text-emerald-800",
};

function PayoutBanner() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ["seller-payout-account"],
    queryFn: async () => {
      const me = await base44.auth.me();
      const accounts = await base44.entities.SellerPayoutAccount.filter({ user_email: me.email });
      return accounts[0] || null;
    },
  });

  const handleConnect = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("createConnectAccount", {});
    if (res.data?.already_onboarded) {
      toast.success("Payout account already connected!");
      queryClient.invalidateQueries({ queryKey: ["seller-payout-account"] });
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error("Could not start onboarding. Please try again.");
    }
    setLoading(false);
  };

  if (isLoading) return null;

  const isReady = account?.payouts_enabled && account?.onboarding_complete;
  if (isReady) return null;

  return (
    <div className="mx-4 mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <BadgeDollarSign className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Set Up Payouts to Get Paid</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 mb-2">
            Connect a Stripe account to receive payouts when items sell. Follow these tips when filling out the form:
          </p>
          <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 mb-3 list-none">
            <li>• <strong>Business type:</strong> Choose <em>Individual</em></li>
            <li>• <strong>Industry:</strong> Select <em>Retail</em> → <em>Other merchandise</em></li>
            <li>• <strong>Website:</strong> Choose "describe your products instead" and enter: <em>Fish tank equipment, fish and coral</em></li>
          </ul>
          <Button
            size="sm"
            className="mt-3 rounded-xl h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Connecting...</>
            ) : (
              <><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Connect Stripe Payout Account</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [me, setMe] = useState(null);
  const [meState, setMeState] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => navigate("/"));
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "success") {
      toast.success("Payout account connected! You can now receive payments.");
      window.history.replaceState({}, "", "/seller-dashboard");
    } else if (params.get("connect") === "refresh") {
      toast.info("Please complete your Stripe setup to receive payouts.");
      window.history.replaceState({}, "", "/seller-dashboard");
    }
  }, [navigate]);

  const { data: myListings = [] } = useQuery({
    queryKey: ["my-listings", me?.email],
    queryFn: () => base44.entities.Listing.filter({ seller_email: me.email }),
    enabled: !!me,
  });

  const { data: sellOrders = [] } = useQuery({
    queryKey: ["selling-orders", me?.email],
    queryFn: () => base44.entities.Order.filter({ seller_email: me.email }, "-created_date"),
    enabled: !!me,
  });

  const deactivateMutation = useMutation({
    mutationFn: (listingId) => base44.entities.Listing.update(listingId, { status: "removed" }),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ["my-listings", me?.email] });
      const previous = queryClient.getQueryData(["my-listings", me?.email]);
      queryClient.setQueryData(["my-listings", me?.email], (old = []) =>
        old.map((l) => l.id === listingId ? { ...l, status: "removed" } : l)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["my-listings", me?.email], ctx.previous);
      toast.error("Failed to deactivate listing");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Listing deactivated");
    },
  });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [photoUploading, setPhotoUploading] = useState(false);

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Listing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Listing updated!");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update listing"),
  });

  const startEdit = (listing) => {
    setEditingId(listing.id);
    setEditDraft({
      title: listing.title,
      price: listing.price?.toString(),
      photos: listing.photos || [],
      quantity: listing.quantity?.toString() || "1",
      description: listing.description || "",
    });
  };

  const saveEdit = () => {
    updateListingMutation.mutate({
      id: editingId,
      data: {
        title: editDraft.title,
        price: parseFloat(editDraft.price) || 0,
        photos: editDraft.photos,
        quantity: parseInt(editDraft.quantity) || 1,
        description: editDraft.description,
      },
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditDraft((prev) => ({ ...prev, photos: [file_url, ...prev.photos.slice(1)] }));
    setPhotoUploading(false);
  };

  const activeListings = myListings.filter(l => l.status === "active");
  const soldListings = myListings.filter(l => l.status === "sold");
  const totalRevenue = sellOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (o.price || 0), 0);
  const pendingOrders = sellOrders.filter(o => ["pending", "confirmed"].includes(o.status));
  const viewCount = myListings.reduce((sum, l) => sum + (l.views || 0), 0);

  const displayedOrders = showAllOrders ? sellOrders : sellOrders.slice(0, 5);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["my-listings", me?.email] });
    await queryClient.invalidateQueries({ queryKey: ["selling-orders", me?.email] });
  }, [queryClient, me?.email]);

  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

  const meForPhotos = meState || me;
  const handleMeUpdate = (updated) => { setMeState(updated); setMe(updated); };

  if (!me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your inventory and track sales</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 text-xs gap-1.5"
            onClick={() => navigate(`/seller/${encodeURIComponent(me.email)}`)}
          >
            <Store className="w-3.5 h-3.5" /> My Store
          </Button>
        </div>
      </div>

      <PayoutBanner />
      <SellingCalculator />

      {/* Metrics Grid */}
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <p className="text-2xl font-bold">{activeListings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active listings</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Revenue</Badge>
            </div>
            <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed sales</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 cursor-pointer" onClick={() => setShowAllOrders(true)}>
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
            </div>
            <p className="text-2xl font-bold">{pendingOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 text-xs">Traffic</Badge>
            </div>
            <p className="text-2xl font-bold">{viewCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Total views</p>
          </div>
        </div>
      </div>

      {/* All Orders Section */}
      {sellOrders.length > 0 && (
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Orders ({sellOrders.length})</h2>
            {sellOrders.length > 5 && (
              <button
                className="text-primary text-sm font-medium"
                onClick={() => setShowAllOrders(v => !v)}
              >
                {showAllOrders ? "Show less" : `See all ${sellOrders.length}`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {displayedOrders.map(order => (
              <button
                key={order.id}
                className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                {order.listing_photo && (
                  <img src={order.listing_photo} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{order.listing_title || "Order"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(order.created_date), "MMM d, yyyy")}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status?.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-bold text-primary">${order.price?.toFixed(2)}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Listings Section */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Active Listings ({activeListings.length})</h2>
          <Link to="/sell" className="text-primary text-sm font-medium flex items-center gap-1">
            + New <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No active listings yet</p>
            <Link to="/sell" className="text-primary text-sm font-medium mt-2 inline-block">
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeListings.map(listing => (
              <div key={listing.id} className="bg-card border border-border rounded-xl p-4">
                {editingId === listing.id ? (
                  <div className="space-y-3">
                    {/* Photo edit */}
                    <div className="relative w-16 h-16">
                      <img
                        src={editDraft.photos?.[0] || listing.photos?.[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg cursor-pointer">
                        {photoUploading ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    {/* Title edit */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                      <Input
                        value={editDraft.title}
                        onChange={(e) => setEditDraft(p => ({ ...p, title: e.target.value }))}
                        className="rounded-lg h-8 text-sm"
                      />
                    </div>
                    {/* Price + Quantity */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                        <Input
                          type="number"
                          value={editDraft.price}
                          onChange={(e) => setEditDraft(p => ({ ...p, price: e.target.value }))}
                          className="rounded-lg h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                        <Input
                          type="number"
                          value={editDraft.quantity}
                          onChange={(e) => setEditDraft(p => ({ ...p, quantity: e.target.value }))}
                          className="rounded-lg h-8 text-sm"
                        />
                      </div>
                    </div>
                    {/* Description edit */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                      <Textarea
                        value={editDraft.description}
                        onChange={(e) => setEditDraft(p => ({ ...p, description: e.target.value }))}
                        className="rounded-lg text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 rounded-lg h-8 text-xs gap-1" onClick={saveEdit} disabled={updateListingMutation.isPending}>
                        {updateListingMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg h-8 text-xs gap-1" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      {listing.photos?.[0] && (
                        <img src={listing.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                        <p className="text-primary font-bold text-sm mt-0.5">${listing.price?.toFixed(2)}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] capitalize">{listing.listing_type}</Badge>
                          {listing.quantity && <Badge variant="outline" className="text-[10px]">{listing.quantity} in stock</Badge>}
                          <Badge variant="outline" className="text-[10px]">{listing.views || 0} views</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs gap-1.5 h-8" onClick={() => navigate(`/listing/${listing.id}`)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs gap-1.5 h-8" onClick={() => startEdit(listing)}>
                        <Edit className="w-3.5 h-3.5" /> Quick Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg text-xs gap-1.5 h-8" onClick={() => navigate(`/sell?edit=${listing.id}`)}>
                        Full Edit
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="flex-1 rounded-lg text-xs gap-1.5 h-8 text-destructive hover:text-destructive"
                        onClick={() => deactivateMutation.mutate(listing.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        <Power className="w-3.5 h-3.5" /> Deactivate
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {soldListings.length > 0 && (
        <div className="px-4 py-4 border-t border-border text-center text-muted-foreground">
          <p className="text-sm">{soldListings.length} sold listing{soldListings.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Tank Photos */}
      <div className="border-t border-border pt-2">
        <TankPhotos me={meForPhotos} onUpdate={handleMeUpdate} />
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}