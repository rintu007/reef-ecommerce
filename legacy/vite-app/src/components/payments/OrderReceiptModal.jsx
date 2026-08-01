import { CheckCircle, MapPin, Clock, Truck, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderReceiptModal({ order, listing, onClose }) {
  const isPickup = order?.shipping_method === "local_pickup";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Order Confirmation</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Success banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Thank you for your order!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
            Your payment was successful. A confirmation has been sent to your email.
          </p>
        </div>

        {/* Item */}
        <div className="flex gap-3 items-center bg-muted rounded-xl p-3">
          {listing?.photos?.[0] && (
            <img src={listing.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">{order?.listing_title}</p>
            <p className="text-xs text-muted-foreground">Sold by {listing?.seller_name || "Seller"}</p>
          </div>
        </div>

        {/* Delivery method */}
        <div className={`rounded-xl border p-4 space-y-2 ${isPickup ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-muted border-border"}`}>
          {isPickup ? (
            <>
              <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                <MapPin className="w-4 h-4" /> Local Pickup
              </div>
              {order?.pickup_address && (
                <p className="text-sm text-foreground font-medium">{order.pickup_address}</p>
              )}
              {order?.pickup_time && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Pickup time: <span className="font-medium text-foreground">{order.pickup_time}</span>
                </div>
              )}
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Funds are held securely and released to the seller after pickup is confirmed. If you don't confirm within 3 business days, pickup is assumed successful and funds are released.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="w-4 h-4" /> Item will be shipped — tracking info will be provided by the seller.
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-muted rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Item price</span>
            <span>${order?.price?.toFixed(2)}</span>
          </div>
          {order?.sales_tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Sales tax (8%)</span>
              <span>${order.sales_tax?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-1">
            <span>Total charged</span>
            <span>${(order?.total_charged || (order?.price + (order?.sales_tax || 0)))?.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">Processing fees are deducted from the seller's payout — not charged to you.</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Your payment is secured by Stripe and held until delivery/pickup is confirmed.
        </div>

        <Button className="w-full h-12 rounded-xl font-bold" onClick={onClose}>
          View My Orders
        </Button>
      </div>
    </div>
  );
}