import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Fee constants (must match createPaymentIntent.js)
const PLATFORM_FEE_RATE = 0.05;      // 5% Reef Market fee
const STRIPE_RATE = 0.029;            // 2.9% Stripe
const STRIPE_FIXED = 0.30;            // $0.30 Stripe fixed
const SALES_TAX_RATE = 0.08;          // 8% sales tax (on listing price, paid by buyer)
const FEATURED_FEE = 0.99;            // $0.99 featured fee deducted on sale

export default function SellingCalculator() {
  const [open, setOpen] = useState(false);
  const [wantToMake, setWantToMake] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [includeFeatured, setIncludeFeatured] = useState(false);

  const result = useMemo(() => {
    const desired = parseFloat(wantToMake) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    if (desired <= 0) return null;

    // We need to find a listing price P such that:
    // seller_receives = P - platform_fee - stripe_fee - shipping - featured_fee = desired
    //
    // stripe_fee = (P + P*SALES_TAX_RATE) * STRIPE_RATE + STRIPE_FIXED
    //            = P*(1 + SALES_TAX_RATE)*STRIPE_RATE + STRIPE_FIXED
    //
    // So: P - P*PLATFORM_FEE_RATE - [P*(1+TAX)*STRIPE_RATE + STRIPE_FIXED] - shipping - featured = desired
    //     P * [1 - PLATFORM_FEE_RATE - (1+TAX)*STRIPE_RATE] = desired + shipping + featured + STRIPE_FIXED
    //     P = (desired + shipping + featured + STRIPE_FIXED) / [1 - PLATFORM_FEE_RATE - (1+TAX)*STRIPE_RATE]

    const featuredDeduction = includeFeatured ? FEATURED_FEE : 0;
    const multiplier = 1 - PLATFORM_FEE_RATE - (1 + SALES_TAX_RATE) * STRIPE_RATE;
    const listingPrice = (desired + shipping + featuredDeduction + STRIPE_FIXED) / multiplier;

    // Calculate actual deductions at that price
    const totalCharge = listingPrice * (1 + SALES_TAX_RATE);
    const stripeFee = totalCharge * STRIPE_RATE + STRIPE_FIXED;
    const platformFee = listingPrice * PLATFORM_FEE_RATE;
    const sellerReceives = listingPrice - platformFee - stripeFee - shipping - featuredDeduction;

    return {
      listingPrice: Math.ceil(listingPrice * 100) / 100, // round up to nearest cent
      platformFee: parseFloat(platformFee.toFixed(2)),
      stripeFee: parseFloat(stripeFee.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      featuredFee: parseFloat(featuredDeduction.toFixed(2)),
      sellerReceives: parseFloat(sellerReceives.toFixed(2)),
    };
  }, [wantToMake, shippingCost, includeFeatured]);

  return (
    <div className="mx-4 mt-4 bg-card border border-border rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Calculator className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Selling Calculator</p>
          <p className="text-xs text-muted-foreground">Figure out what to charge</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-border pt-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">I want to make</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={wantToMake}
                  onChange={e => setWantToMake(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Shipping cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={e => setShippingCost(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Featured listing</p>
              <p className="text-xs text-muted-foreground">$0.99 fee deducted on sale</p>
            </div>
            <Switch checked={includeFeatured} onCheckedChange={setIncludeFeatured} />
          </div>

          {/* Result */}
          {result ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">List your item for</p>
                <p className="text-3xl font-bold text-primary">${result.listingPrice.toFixed(2)}</p>
              </div>

              <div className="border-t border-primary/10 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Reef Market fee (5%)</span>
                  <span className="text-destructive">−${result.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Stripe fee (2.9% + $0.30)</span>
                  <span className="text-destructive">−${result.stripeFee.toFixed(2)}</span>
                </div>
                {result.shipping > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping cost</span>
                    <span className="text-destructive">−${result.shipping.toFixed(2)}</span>
                  </div>
                )}
                {result.featuredFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Featured fee</span>
                    <span className="text-destructive">−${result.featuredFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-sm border-t border-primary/10 pt-2 text-foreground">
                  <span>You receive</span>
                  <span className="text-emerald-600">≈${result.sellerReceives.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-muted/60 rounded-lg p-2">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Buyer pays 8% sales tax on top of your listing price. Stripe fee is calculated on the buyer's total.</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              Enter an amount above to see what to charge
            </div>
          )}
        </div>
      )}
    </div>
  );
}