import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { BadgeDollarSign, Loader2, ChevronRight, Clock, ArrowRight, Building2, CreditCard, ShieldCheck } from "lucide-react";

export default function PayoutSetupPrompt({ onContinue, onSkip }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("createConnectAccount", {});
    if (res.data?.already_onboarded) {
      toast.success("Payout account already connected!");
      onContinue();
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error("Could not start setup. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 pt-10 pb-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <BadgeDollarSign className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Set Up Your Payouts</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Connect a Stripe account so you can receive money when your items sell. This only takes a couple of minutes.
        </p>
      </div>

      {/* How it works */}
      <div className="space-y-3 mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">How payments work</p>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</div>
            <div>
              <p className="font-semibold text-sm">Buyer purchases your item</p>
              <p className="text-xs text-muted-foreground">They pay the listing price + sales tax. You receive <strong>95%</strong> of your listing price (Reef Market's 5% fee + processing costs are deducted from your payout).</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</div>
            <div>
              <p className="font-semibold text-sm">Funds held securely</p>
              <p className="text-xs text-muted-foreground">Payment is held by Stripe while the order is in transit or awaiting pickup.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Payment released to you</p>
              <p className="text-xs text-muted-foreground">Once delivery or pickup is confirmed, your 95% is deposited directly to your bank account via Stripe.</p>
            </div>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="bg-muted rounded-xl p-4 space-y-1.5 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Example — $100 listing</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buyer pays</span>
            <span className="font-medium">$100 + tax + Stripe fee</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reef Market fee (5%)</span>
            <span className="text-destructive font-medium">− $5.00</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2 font-bold">
            <span>You receive</span>
            <span className="text-emerald-600">$95.00</span>
          </div>
        </div>

        {/* What you'll need */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What you'll need for setup</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span>Bank account or debit card for deposits</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-primary shrink-0" />
              <span>Social Security Number (last 4 digits for identity)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Secure, encrypted — handled entirely by Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-auto">
        <Button
          className="w-full h-12 rounded-xl font-bold text-base"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Connecting...</>
          ) : (
            <><BadgeDollarSign className="w-5 h-5 mr-2" /> Connect Payout Account</>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full h-10 rounded-xl text-muted-foreground text-sm"
          onClick={onSkip}
        >
          Set up later (you won't be able to receive payments until connected)
        </Button>
      </div>
    </div>
  );
}