import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingBag, Star, CheckCircle, Truck, MapPin, Clock, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SubmitReviewModal from "@/components/reviews/SubmitReviewModal";
import { useCart } from "@/lib/CartContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { getT } from "@/lib/i18n";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-destructive/10 text-destructive",
  doa_claim: "bg-destructive/10 text-destructive",
};

export default function Orders() {
  const { language } = useUserPrefs();
  const t = getT(language);
  const [me, setMe] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState(urlParams.get("tab") || "buying");
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [submittingTracking, setSubmittingTracking] = useState({});
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const [cancelling, setCancelling] = useState({});
  const [deletingOrder, setDeletingOrder] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe);
  }, []);

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId) => base44.functions.invoke("deleteOrder", { orderId }),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ["orders", "buying", me?.email] });
      const previous = queryClient.getQueryData(["orders", "buying", me?.email]);
      queryClient.setQueryData(["orders", "buying", me?.email], (old = []) =>
        old.filter((o) => o.id !== orderId)
      );
      return { previous };
    },
    onError: (_err, _orderId, ctx) => {
      queryClient.setQueryData(["orders", "buying", me?.email], ctx.previous);
      toast.error("Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted");
      setDeletingOrder(null);
    },
  });

  const { data: buyOrders = [] } = useQuery({
    queryKey: ["orders", "buying", me?.email],
    queryFn: () => base44.entities.Order.filter({ buyer_email: me.email }, "-created_date", 50),
    enabled: !!me,
  });

  const { data: sellOrders = [] } = useQuery({
    queryKey: ["orders", "selling", me?.email],
    queryFn: () => base44.entities.Order.filter({ seller_email: me.email }, "-created_date", 50),
    enabled: !!me,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ["my-given-reviews", me?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: me.email }),
    enabled: !!me,
  });

  const reviewedOrderIds = new Set(myReviews.map((r) => r.listing_id));

  const confirmReceipt = async (order) => {
    const res = await base44.functions.invoke("releasePaymentToSeller", { order_id: order.id });
    if (res.data?.success) {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  };

  const markPickedUp = async (order) => {
    const res = await base44.functions.invoke("confirmLocalPickup", { order_id: order.id, action: "seller_mark_pickup" });
    if (res.data?.success) {
      toast.success("Marked as picked up — buyer has been notified to confirm");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else {
      toast.error(res.data?.error || "Failed");
    }
  };

  const confirmPickup = async (order) => {
    const res = await base44.functions.invoke("confirmLocalPickup", { order_id: order.id, action: "buyer_confirm_pickup" });
    if (res.data?.success) {
      toast.success("Pickup confirmed! Funds released to seller.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else {
      toast.error(res.data?.error || "Failed");
    }
  };

  const denyPickup = async (order) => {
    const res = await base44.functions.invoke("confirmLocalPickup", { order_id: order.id, action: "buyer_deny_pickup" });
    if (res.data?.success) {
      toast.success("Pickup denied — seller has been notified.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else {
      toast.error(res.data?.error || "Failed");
    }
  };

  const submitTracking = async (order) => {
    const tracking = trackingInputs[order.id]?.trim();
    const carrier = trackingInputs[`${order.id}_carrier`]?.trim();
    if (!tracking) return;
    setSubmittingTracking(prev => ({ ...prev, [order.id]: true }));
    const res = await base44.functions.invoke("addTrackingNumber", {
      order_id: order.id,
      tracking_number: tracking,
      carrier: carrier || null,
    });
    if (res.data?.success) {
      toast.success("Tracking number saved — order marked as shipped!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else {
      toast.error(res.data?.error || "Failed to save tracking number");
    }
    setSubmittingTracking(prev => ({ ...prev, [order.id]: false }));
  };

  const cancelOrder = async (order) => {
    setCancelling(prev => ({ ...prev, [order.id]: true }));
    // Optimistic update
    const prevData = queryClient.getQueryData(["orders", "buying", me?.email]);
    queryClient.setQueryData(["orders", "buying", me?.email], (old = []) =>
      old.map((o) => o.id === order.id ? { ...o, status: "cancelled" } : o)
    );
    const res = await base44.functions.invoke("cancelOrder", { order_id: order.id });
    if (res.data?.success) {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else {
      queryClient.setQueryData(["orders", "buying", me?.email], prevData);
      toast.error(res.data?.error || "Failed to cancel order");
    }
    setCancelling(prev => ({ ...prev, [order.id]: false }));
  };

  const orders = tab === "buying" ? buyOrders : sellOrders;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);
  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">{t("orders")}</h1>
      </div>

      <div className="px-4 mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="buying" className="flex-1 gap-1.5">
              <ShoppingBag className="w-4 h-4" /> {t("buying")}
            </TabsTrigger>
            <TabsTrigger value="selling" className="flex-1 gap-1.5">
              <Package className="w-4 h-4" /> {t("selling")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{t("no_orders")}</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => {
            const canReview = tab === "buying" && ["delivered", "completed"].includes(order.status) && !reviewedOrderIds.has(order.listing_id);
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                <Link to={`/listing/${order.listing_id}`} className="block">
                  <div className="flex gap-3">
                    {order.listing_photo && (
                      <img src={order.listing_photo} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{order.listing_title || "Order"}</h3>
                      <p className="text-lg font-bold text-primary mt-0.5">${order.price?.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"} text-[10px] capitalize`}>
                          {order.status?.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(order.created_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Pickup details for buyer */}
                {tab === "buying" && order.shipping_method === "local_pickup" && order.pickup_address && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
                      <MapPin className="w-3.5 h-3.5" /> {t("pickup_address")}
                    </div>
                    <p className="text-foreground">{order.pickup_address}</p>
                    {order.pickup_time && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3 h-3" /> {order.pickup_time}
                      </div>
                    )}
                  </div>
                )}
                {/* Seller: mark local pickup as complete */}
                {tab === "selling" && order.shipping_method === "local_pickup" && ["confirmed", "pending"].includes(order.status) && !order.seller_marked_picked_up && (
                  <Button
                    size="sm"
                    className="w-full mt-3 rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                    onClick={() => markPickedUp(order)}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("mark_picked_up")}
                  </Button>
                )}
                {tab === "selling" && order.shipping_method === "local_pickup" && order.seller_marked_picked_up && order.status === "awaiting_pickup" && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">{t("awaiting_buyer_confirm")}</p>
                )}
                {/* Buyer: confirm or deny pickup */}
                {tab === "buying" && order.shipping_method === "local_pickup" && order.status === "awaiting_pickup" && !order.buyer_confirmed_pickup && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium text-center">{t("did_you_receive")}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => confirmPickup(order)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t("yes_i_got_it")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                        onClick={() => denyPickup(order)}
                      >
                        {t("no_i_didnt")}
                      </Button>
                    </div>
                  </div>
                )}
                {/* Seller: add tracking for confirmed/shipped orders */}
                {tab === "selling" && order.shipping_method === "shipping" && ["confirmed", "pending"].includes(order.status) && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Mark as Shipped</p>
                    <Input
                      placeholder="Carrier (e.g. UPS, FedEx, USPS)"
                      value={trackingInputs[`${order.id}_carrier`] || ""}
                      onChange={(e) => setTrackingInputs(prev => ({ ...prev, [`${order.id}_carrier`]: e.target.value }))}
                      className="text-xs h-8 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tracking number"
                        value={trackingInputs[order.id] || ""}
                        onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="text-xs h-8 rounded-lg"
                      />
                      <Button
                        size="sm"
                        className="rounded-lg text-xs gap-1 shrink-0 bg-primary"
                        onClick={() => submitTracking(order)}
                        disabled={submittingTracking[order.id] || !trackingInputs[order.id]?.trim()}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Ship
                      </Button>
                    </div>
                  </div>
                )}
                {/* Show tracking number if already shipped */}
                {order.tracking_number && (
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
                        {order.carrier ? order.carrier : "Tracking Number"}
                      </p>
                      <p className="text-sm font-mono font-bold text-foreground truncate">{order.tracking_number}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-lg text-xs h-8"
                      onClick={() => { navigator.clipboard.writeText(order.tracking_number); toast.success("Copied!"); }}
                    >
                      Copy
                    </Button>
                  </div>
                )}
                {/* Buyer: confirm receipt button for shipped orders (fallback if tracking doesn't auto-detect) */}
                {tab === "buying" && order.shipping_method !== "local_pickup" && ["shipped", "delivered"].includes(order.status) && (
                  <Button
                    size="sm"
                    className="w-full mt-3 rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => confirmReceipt(order)}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("confirm_receipt")}
                  </Button>
                )}
                {/* Pending order actions - buyer */}
                {tab === "buying" && order.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl text-xs gap-1.5"
                      onClick={() => {
                        addItem({ id: order.listing_id, title: order.listing_title, photos: [order.listing_photo], price: order.price });
                        toast.success("Added to cart");
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      {t("re_add_cart")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl text-xs gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => cancelOrder(order)}
                      disabled={cancelling[order.id]}
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("cancel")}
                    </Button>
                  </div>
                )}
                {tab === "buying" && order.status === "cancelled" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 rounded-xl text-xs gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t("delete_order")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_order")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("delete_order_desc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteOrderMutation.mutate(order.id)}
                          disabled={deleteOrderMutation.isPending}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {canReview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 rounded-xl text-xs gap-1.5"
                    onClick={() => setReviewingOrder(order)}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {t("rate_seller")}
                  </Button>
                )}
                {tab === "buying" && reviewedOrderIds.has(order.listing_id) && (
                  <p className="text-center text-[10px] text-muted-foreground mt-2">{t("reviewed_seller")}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewingOrder && (
        <SubmitReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["my-given-reviews", "sellerStats"] })}
        />
      )}
    </div>
  );
}