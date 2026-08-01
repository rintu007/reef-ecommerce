import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, MapPin } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { formatPrice } from "@/lib/currencies";

let stripePromise = null;
const getStripe = (key) => {
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
};

function CartPaymentForm({ listings, clientSecret, breakdown, onSuccess, onClose, publishableKey }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message);
      setPaying(false);
    } else {
      // Create orders for each listing
      try {
        await base44.functions.invoke("createCartOrders", {
          listing_ids: listings.map(l => l.id),
          payment_intent_id: result.paymentIntent?.id || "",
          breakdown,
        });
      } catch (e) {
        // Non-blocking: orders will be created by webhook as fallback
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Item list */}
      <div className="space-y-2">
        {listings.map(l => (
          <div key={l.id} className="flex items-center gap-3 bg-muted rounded-xl p-3">
            {l.photos?.[0] && (
              <img src={l.photos[0]} alt={l.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{l.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{l.listing_type?.replace(/_/g, " ")}</p>
            </div>
            <p className="text-sm font-bold text-primary shrink-0">{formatPrice(l.price, l.currency)}</p>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="bg-muted rounded-xl p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{listings.length} item{listings.length !== 1 ? "s" : ""}</span>
          <span>{formatPrice(breakdown.items_total, "USD")}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Sales tax</span>
          <span className="italic text-xs">Calculated at checkout</span>
        </div>
        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-1">
          <span>Total</span>
          <span>{formatPrice(breakdown.items_total, "USD")} + tax</span>
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">Reef Market's 5% fee is deducted from the seller's payout.</p>
      </div>

      {/* Shipping note */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <Truck className="w-4 h-4" /> Shipping & Pickup
        </div>
        <p className="text-xs text-muted-foreground">The seller will contact you after purchase to arrange shipping or pickup for each item.</p>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Payment secured by Stripe.
      </div>

      <Button type="submit" disabled={paying || !stripe} className="w-full h-12 rounded-xl font-bold text-base">
        {paying ? "Processing..." : `Pay ${formatPrice(breakdown.items_total, "USD")}`}
      </Button>
    </form>
  );
}

export default function CartCheckoutModal({ listings, sellerEmail, onClose, onSuccess }) {
  const [publishableKey, setPublishableKey] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize payment on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke("createCartPaymentIntent", {
          listing_ids: listings.map(l => l.id),
          seller_email: sellerEmail,
        });
        setClientSecret(res.data.client_secret);
        setBreakdown(res.data.breakdown);
        setPublishableKey(res.data.publishable_key);
        setInitialized(true);
      } catch (e) {
        setError(e.message || "Failed to initialize payment.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Checkout — {listings.length} Item{listings.length !== 1 ? "s" : ""}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" onClick={onClose}>Go Back</Button>
            </div>
          )}

          {initialized && clientSecret && publishableKey && breakdown && (
            <Elements stripe={getStripe(publishableKey)} options={{ clientSecret }}>
              <CartPaymentForm
                listings={listings}
                clientSecret={clientSecret}
                breakdown={breakdown}
                onSuccess={onSuccess}
                onClose={onClose}
                publishableKey={publishableKey}
              />
            </Elements>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}