import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Loader2, X } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  doa_claim: "bg-orange-100 text-orange-800",
  awaiting_pickup: "bg-purple-100 text-purple-800",
  pickup_confirmed: "bg-purple-100 text-purple-800",
};

const PENDING_REASONS = {
  awaiting_payment: "Awaiting buyer payment",
  awaiting_seller_shipment: "Awaiting seller to ship",
  payment_processing: "Payment processing",
};

export default function AdminOrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 200),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="space-y-4 mt-4">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-primary hover:underline text-sm">
          ← Back to Orders
        </button>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm font-semibold">{selectedOrder.id}</p>
            </div>
            <Badge className={`${STATUS_COLORS[selectedOrder.status] || "bg-gray-100 text-gray-800"}`}>
              {selectedOrder.status?.replace(/_/g, " ")}
            </Badge>
          </div>

          {/* Item info */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Item</p>
            <p className="font-semibold text-sm">{selectedOrder.listing_title}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm">Price</span>
              <span className="font-semibold">${selectedOrder.price?.toFixed(2)}</span>
            </div>
          </div>

          {/* Buyer & Seller */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Buyer</p>
              <p className="text-xs font-medium break-all">{selectedOrder.buyer_email}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Seller</p>
              <p className="text-xs font-medium break-all">{selectedOrder.seller_email}</p>
            </div>
          </div>

          {/* Shipping / Pickup */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Delivery Method</p>
            <p className="text-sm capitalize">{selectedOrder.shipping_method?.replace(/_/g, " ")}</p>
            {selectedOrder.shipping_method === "shipping" && selectedOrder.tracking_number && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">Tracking</p>
                <p className="font-mono text-xs">{selectedOrder.tracking_number}</p>
                {selectedOrder.carrier && <p className="text-[10px] text-muted-foreground">{selectedOrder.carrier}</p>}
              </div>
            )}
            {selectedOrder.shipping_method === "local_pickup" && selectedOrder.pickup_time && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">Pickup Time</p>
                <p className="text-xs font-medium">{selectedOrder.pickup_time}</p>
                {selectedOrder.pickup_address && <p className="text-[10px] text-muted-foreground mt-1">{selectedOrder.pickup_address}</p>}
              </div>
            )}
          </div>

          {/* Pricing breakdown */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Item Price</span>
              <span className="font-medium">${selectedOrder.price?.toFixed(2)}</span>
            </div>
            {selectedOrder.sales_tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Sales Tax</span>
                <span className="font-medium">${selectedOrder.sales_tax?.toFixed(2)}</span>
              </div>
            )}
            {selectedOrder.buyer_service_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Service Fee</span>
                <span className="font-medium">${selectedOrder.buyer_service_fee?.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total Charged</span>
              <span>${selectedOrder.total_charged?.toFixed(2)}</span>
            </div>
          </div>

          {/* Status reason if pending */}
          {selectedOrder.status === "pending" && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase mb-1">Pending Reason</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {PENDING_REASONS["awaiting_payment"] || "Processing your order"}
              </p>
            </div>
          )}

          {/* Created date */}
          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Created {new Date(selectedOrder.created_date).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {orders.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No orders yet</p>
      ) : (
        orders.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelectedOrder(o)}
            className="w-full text-left bg-card border border-border rounded-xl p-3 hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-lg p-2 shrink-0">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{o.listing_title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-muted-foreground">{o.buyer_email}</p>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <p className="text-xs text-muted-foreground">{o.seller_email}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={`${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-800"} text-[10px]`}>
                    {o.status?.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-semibold">${o.total_charged?.toFixed(2)}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </button>
        ))
      )}
    </div>
  );
}