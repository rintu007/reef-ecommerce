import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, X } from "lucide-react";

export default function BuyerAgreementModal({ onAgree, onClose, requireEmail = false }) {
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Buyer Agreement
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Please read and agree to the following before purchasing on Reef Market.
        </p>

        <div className="bg-muted rounded-xl p-4 space-y-3 text-sm text-foreground max-h-72 overflow-y-auto">
          <div>
            <p className="font-bold mb-1">💳 What You Pay</p>
            <p className="text-muted-foreground mb-2">
              As a buyer, you pay the <strong>item price + any shipping the seller has set + sales tax. No platform fees or processing fees are ever added to your total.</strong>
            </p>
            <div className="bg-background border border-border rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground mb-1">Example — buying a coral listed at $100 with $15 shipping:</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Listing price</span><span>$100.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Seller's shipping charge</span><span>$15.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sales tax (varies by state)</span><span>~$8.30</span></div>
              <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>You pay</span><span className="text-primary">~$123.30</span></div>
              <p className="text-muted-foreground mt-1.5 italic">Reef Market's 5% fee and Stripe's processing fee are deducted from the <strong>seller's payout</strong> — never added to your price. If a seller sets shipping to $0, you only pay item price + tax.</p>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Some sellers offer <strong>tiered shipping pricing</strong> — the shipping cost may vary depending on how many items you buy. The final shipping cost is always shown clearly before you confirm payment.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">🔒 Funds Are Held Securely</p>
            <p className="text-muted-foreground">
              Your payment is held by Reef Market and is <strong>not released to the seller until delivery or pickup is confirmed</strong>. This protects you as a buyer.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">📦 Shipped Orders</p>
            <p className="text-muted-foreground">
              Once the seller ships your item and enters a tracking number, your order status updates to "Shipped." Funds are released to the seller automatically when the tracking shows delivery. You can also manually confirm receipt to release funds early.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">📍 Local Pickup Orders</p>
            <p className="text-muted-foreground">
              For local pickup, you will receive the <strong>exact pickup address and your chosen pickup time</strong> in your order confirmation. Funds are held until:
            </p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside mt-1">
              <li>The seller marks the item as picked up, AND you confirm pickup via email, OR</li>
              <li>3 business days pass after the seller marks pickup — at which point pickup is assumed successful and funds are released automatically.</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-1">🐟 DOA / Arrival Policy</p>
            <p className="text-muted-foreground">
              Each seller sets their own Dead on Arrival (DOA) policy for live animals. Always review the seller's policy before purchasing. For DOA claims, photo proof of the animal still in a sealed bag is typically required <strong>within 2 hours of delivery</strong>.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">❌ Cancellations & Refunds</p>
            <p className="text-muted-foreground">
              All sales are final unless the seller's DOA policy provides otherwise. If you have an issue with an order, contact the seller directly through messaging. Reef Market may intervene in disputes at its discretion.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">✅ Your Responsibilities</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Be present or available at the agreed pickup time</li>
              <li>Confirm receipt of shipped items promptly</li>
              <li>Confirm or dispute pickup within 3 business days</li>
              <li>Follow all applicable local laws regarding live animal purchase</li>
            </ul>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary shrink-0"
          />
          <span className="text-sm text-foreground">
            I have read and agree to the Reef Market Buyer Agreement, including the payment hold policy and pickup/delivery terms.
          </span>
        </label>

        {requireEmail && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Your Email</label>
            <Input
              type="email"
              placeholder="Enter your email for order confirmation..."
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="rounded-xl"
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>
        )}

        <Button
          className="w-full h-12 rounded-xl font-bold"
          disabled={!checked}
          onClick={() => {
            if (requireEmail) {
              if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setEmailError("Please enter a valid email address.");
                return;
              }
              onAgree(email.trim());
            } else {
              onAgree();
            }
          }}
        >
          Agree & Continue to Payment
        </Button>
      </div>
    </div>
  );
}