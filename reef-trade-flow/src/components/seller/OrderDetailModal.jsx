import { format } from "date-fns";
import { X, MapPin, Clock, Package, Truck, AlertCircle, CheckCircle, ShoppingBag, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STATUS_INFO = {
  pending: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
    iconColor: "text-amber-600",
    label: "Pending",
    explanation: "Payment has been received but the order is waiting to be confirmed. This may happen if payment processing is still completing. No action needed — this typically resolves within a few minutes.",
    actions_needed: false,
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: ShoppingBag,
    iconColor: "text-blue-600",
    label: "Confirmed",
    explanation: "Payment confirmed. Action required: prepare the item and either add a tracking number (for shipping) or mark it as ready for pickup.",
    actions_needed: true,
  },
  shipped: {
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
    iconColor: "text-primary",
    label: "Shipped",
    explanation: "Item has been shipped and a tracking number was provided. Waiting for the buyer to confirm receipt. Funds will be released once delivery is confirmed.",
    actions_needed: false,
  },
  awaiting_pickup: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
    iconColor: "text-blue-600",
    label: "Awaiting Pickup Confirmation",
    explanation: "You marked this as picked up. Waiting for the buyer to confirm they received the item. Funds will auto-release after 3 business days if no response.",
    actions_needed: false,
  },
  delivered: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    label: "Delivered",
    explanation: "Item was delivered. Waiting for the buyer to confirm receipt and release funds to your account.",
    actions_needed: false,
  },
  completed: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    label: "Completed",
    explanation: "Order complete! Funds have been released to your Stripe payout account.",
    actions_needed: false,
  },
  cancelled: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: X,
    iconColor: "text-destructive",
    label: "Cancelled",
    explanation: "This order was cancelled. If payment was collected, a refund was issued to the buyer.",
    actions_needed: false,
  },
  doa_claim: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
    iconColor: "text-destructive",
    label: "DOA Claim Filed",
    explanation: "The buyer has filed a Dead on Arrival claim. Please check your email for instructions on how to resolve this dispute.",
    actions_needed: true,
  },
  pickup_confirmed: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    label: "Pickup Confirmed",
    explanation: "Buyer confirmed local pickup. Funds released to your payout account.",
    actions_needed: false,
  },
};

export default function OrderDetailModal({ order, onClose }) {
  const navigate = useNavigate();
  const info = STATUS_INFO[order.status] || STATUS_INFO.pending;
  const Icon = info.icon;

  const platformFee = order.price ? order.price * 0.05 : 0;
  const stripeFee = order.total_charged ? order.total_charged * 0.029 + 0.30 : 0;
  const yourPayout = order.price ? order.price - platformFee - stripeFee : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-base">Order Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Item */}
          <div className="flex gap-3 items-center">
            {order.listing_photo && (
              <img src={order.listing_photo} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{order.listing_title || "Order"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Buyer: {order.buyer_email}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_date), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`rounded-xl border p-3 flex gap-3 items-start ${info.color}`}>
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${info.iconColor}`} />
            <div>
              <p className="font-semibold text-sm">{info.label}</p>
              <p className="text-xs mt-0.5 leading-relaxed opacity-80">{info.explanation}</p>
            </div>
          </div>

          {/* Delivery method */}
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery</p>
            {order.shipping_method === "local_pickup" ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">Local Pickup</span>
                </div>
                {order.pickup_address && (
                  <p className="text-xs text-muted-foreground pl-6">{order.pickup_address}</p>
                )}
                {order.pickup_time && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                    <Clock className="w-3 h-3" /> {order.pickup_time}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">Shipping</span>
                </div>
                {order.tracking_number ? (
                  <p className="text-xs text-muted-foreground pl-6">
                    Tracking: <span className="font-mono font-semibold text-foreground">{order.tracking_number}</span>
                    {order.carrier && ` (${order.carrier})`}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400 pl-6">⚠️ No tracking number yet — add one in Orders to mark as shipped.</p>
                )}
              </div>
            )}
          </div>

          {/* Earnings breakdown */}
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Earnings</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Listing price</span>
              <span>${order.price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (5%)</span>
              <span className="text-destructive">− ${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stripe fee (~2.9% + $0.30)</span>
              <span className="text-destructive">− ${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1.5 mt-1">
              <span>Est. payout to you</span>
              <span className="text-emerald-600">~${yourPayout.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Buyer Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          {/* Action button */}
          {info.actions_needed && (
            <Button
              className="w-full rounded-xl h-11 font-semibold"
              onClick={() => { onClose(); navigate("/orders"); }}
            >
              <Package className="w-4 h-4 mr-2" />
              Manage in Orders
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}