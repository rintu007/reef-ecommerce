import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import BuyerAgreementModal from "@/components/payments/BuyerAgreementModal";
import { formatPrice } from "@/lib/currencies";

function getShippingForQty(listing, qty) {
  const tiers = (listing.shipping_tiers || []).slice().sort((a, b) => a.up_to_qty - b.up_to_qty);
  if (tiers.length === 0) return listing.shipping_cost || 0;
  const tier = tiers.find(t => qty <= t.up_to_qty);
  return tier ? tier.price : tiers[tiers.length - 1].price;
}

let stripePromise = null;
const getStripe = (key) => {
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
};

function PaymentForm({ listing, clientSecret, breakdown, shippingMethod, selectedPickupTime, onSuccess, onClose, publishableKey }) {
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
      // Create order immediately so it shows up right away (webhook is async fallback)
      try {
        await base44.functions.invoke("createOrderAfterPayment", {
          listing_id: listing.id,
          shipping_method: shippingMethod,
          pickup_time: selectedPickupTime || "",
          payment_intent_id: result.paymentIntent?.id || "",
          breakdown,
          quantity: breakdown?.quantity || 1,
        });
      } catch (e) {
        // Webhook will handle it as fallback — don't block success
      }
      onSuccess(selectedPickupTime, breakdown);
    }
  };

  const currency = breakdown.currency || "USD";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Price breakdown */}
      <div className="bg-muted rounded-xl p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Item price{breakdown.quantity > 1 ? ` × ${breakdown.quantity}` : ""}</span>
          <span>{formatPrice(breakdown.item_subtotal ?? breakdown.listing_price, currency)}</span>
        </div>
        {breakdown.shipping_cost > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{formatPrice(breakdown.shipping_cost, currency)}</span>
          </div>
        )}
        {breakdown.shipping_cost === 0 && shippingMethod === "shipping" && (
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="text-emerald-600 font-medium">Free</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Sales tax</span>
          <span className="italic text-xs">Calculated at checkout</span>
        </div>
        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-1">
          <span>Total</span>
          <span>{formatPrice(breakdown.total_charged, currency)} + tax</span>
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">Tax is calculated by Stripe based on your address. Reef Market's 5% fee is deducted from the seller's payout.</p>
      </div>

      {/* Delivery info */}
      {shippingMethod === "local_pickup" ? (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
            <MapPin className="w-4 h-4" /> Local Pickup
          </div>
          {listing.pickup_address && (
            <p className="text-muted-foreground">{listing.pickup_address}</p>
          )}
          {selectedPickupTime && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedPickupTime}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-xl p-3">
          <Truck className="w-4 h-4" /> Seller will ship and provide tracking info.
        </div>
      )}

      <PaymentElement />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Payment secured by Stripe. Funds held until delivery confirmed.
      </div>

      <Button type="submit" disabled={paying || !stripe} className="w-full h-12 rounded-xl font-bold text-base">
        {paying ? "Processing..." : `Pay ${formatPrice(breakdown.total_charged, currency)}`}
      </Button>
    </form>
  );
}

export default function CheckoutModal({ listing, onClose, onSuccess }) {
  const { isGuest } = useAuth();
  const [step, setStep] = useState("agreement"); // agreement | options | pickup_time | payment
  const [publishableKey, setPublishableKey] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [guestEmail, setGuestEmail] = useState(null);

  const minQty = listing.min_qty || 1;
  const maxQty = listing.quantity || 1;
  const [quantity, setQuantity] = useState(minQty);

  const bothMethods = listing.shipping_available && listing.local_pickup;
  const defaultMethod = listing.local_pickup && !listing.shipping_available
    ? "local_pickup"
    : "shipping";
  const [shippingMethod, setShippingMethod] = useState(defaultMethod);

  const needsPickupTime = shippingMethod === "local_pickup" && listing.pickup_times?.length > 0;

  const currentShippingCost = shippingMethod === "shipping" ? getShippingForQty(listing, quantity) : 0;
  const itemSubtotal = listing.price * quantity;
  const orderTotal = itemSubtotal + currentShippingCost;

  const initPayment = async (emailOverride) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { listing_id: listing.id, shipping_method: shippingMethod, quantity };
      if (emailOverride || guestEmail) payload.buyer_email = emailOverride || guestEmail;
      const res = await base44.functions.invoke("createPaymentIntent", payload);
      if (res.data?.error) { setError(res.data.error); setLoading(false); return; }
      setClientSecret(res.data.client_secret);
      setBreakdown(res.data.breakdown);
      setPublishableKey(res.data.publishable_key);
      setStep("payment");
    } catch (e) {
      setError(e.message || "Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAgreed = (email) => {
    if (isGuest && email) setGuestEmail(email);
    setStep("options");
  };

  const handleOptionsContinue = () => {
    if (needsPickupTime) {
      setStep("pickup_time");
    } else {
      initPayment();
    }
  };

  const handlePickupContinue = () => {
    initPayment();
  };

  if (step === "agreement") {
    return <BuyerAgreementModal onAgree={handleAgreed} onClose={onClose} requireEmail={isGuest} />;
  }

  if (step === "options") {
    const currency = listing.currency || "USD";
    return (
      <Drawer open onOpenChange={(open) => { if (!open) onClose(); }} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Order Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto space-y-5">
            {/* Quantity */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Quantity</p>
              {minQty > 1 && <p className="text-xs text-amber-600">Minimum order: {minQty}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(minQty, q - 1))}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center"
                  disabled={quantity <= minQty}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  min={minQty}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQty, Math.max(minQty, parseInt(e.target.value) || minQty)))}
                  className="w-20 text-center rounded-xl"
                />
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center"
                  disabled={quantity >= maxQty}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground">{maxQty} available</span>
              </div>
            </div>

            {/* Delivery method (only when both available) */}
            {bothMethods && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Delivery Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShippingMethod("shipping")}
                    className={`rounded-xl border p-3 text-sm font-medium flex items-center gap-2 transition-colors ${shippingMethod === "shipping" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    <Truck className="w-4 h-4" /> Shipping
                  </button>
                  <button
                    onClick={() => setShippingMethod("local_pickup")}
                    className={`rounded-xl border p-3 text-sm font-medium flex items-center gap-2 transition-colors ${shippingMethod === "local_pickup" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    <MapPin className="w-4 h-4" /> Local Pickup
                  </button>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="bg-muted rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Item price × {quantity}</span>
                <span>{formatPrice(itemSubtotal, currency)}</span>
              </div>
              {shippingMethod === "shipping" && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className={currentShippingCost === 0 ? "text-emerald-600 font-medium" : ""}>
                    {currentShippingCost === 0 ? "Free" : formatPrice(currentShippingCost, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-1">
                <span>Subtotal</span>
                <span>{formatPrice(orderTotal, currency)} + tax</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleOptionsContinue} disabled={loading}>
              {loading ? "Loading..." : "Continue to Payment"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>
            {step === "pickup_time" ? "Choose Pickup Time" : "Complete Purchase"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto space-y-4">
          {step === "pickup_time" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a pickup time offered by the seller:</p>
              <div className="space-y-2">
                {listing.pickup_times.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedPickupTime(slot)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      selectedPickupTime === slot
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 inline mr-2 opacity-60" />
                    {slot}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full h-12 rounded-xl font-bold"
                disabled={!selectedPickupTime || loading}
                onClick={handlePickupContinue}
              >
                {loading ? "Loading..." : "Continue to Payment"}
              </Button>
            </div>
          )}

          {step === "payment" && clientSecret && publishableKey && (
            <Elements stripe={getStripe(publishableKey)} options={{ clientSecret }}>
              <PaymentForm
                listing={listing}
                clientSecret={clientSecret}
                breakdown={breakdown}
                shippingMethod={shippingMethod}
                selectedPickupTime={selectedPickupTime}
                onSuccess={onSuccess}
                onClose={onClose}
                publishableKey={publishableKey}
              />
            </Elements>
          )}

          {step === "payment" && loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {step === "payment" && error && !loading && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}