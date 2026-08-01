import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X, DollarSign, Truck, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";

function FeeRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? "font-bold border-t border-border mt-1 pt-2" : ""}`}>
      <span className={highlight ? "text-foreground" : "text-muted-foreground text-sm"}>{label}</span>
      <span className={highlight ? "text-emerald-600 text-base" : "text-sm"}>{value}</span>
    </div>
  );
}

function Section({ icon: Icon, iconBg, iconColor, title, children }) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="font-bold mb-1.5">{title}</p>
        {children}
      </div>
    </div>
  );
}

export default function SellerAgreementModal({ onAgree, onClose }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-bottom) - 72px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-border">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Seller Agreement
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 text-sm">

          {/* Fee Breakdown — most important, first */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
            <p className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> What You'll Be Charged Per Sale
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mb-3">
              All fees are deducted from <strong>your payout</strong>. Reef Market's 5% platform fee and Stripe's processing fee apply to the <strong>full amount the buyer pays</strong> (item price + any shipping you charge). Here's an example with a $100 item and $15 shipping:
            </p>
            <div className="bg-white dark:bg-black/20 rounded-lg p-3 text-sm border border-amber-200 dark:border-amber-700 space-y-0.5">
              <FeeRow label="Buyer pays (item + shipping + tax)" value="~$123.30" />
              <FeeRow label="Your item price" value="$100.00" />
              <FeeRow label="Your shipping charge" value="$15.00" />
              <FeeRow label="Reef Market platform fee (5% of $115)" value="− $5.75" />
              <FeeRow label="Stripe processing fee (2.9% + $0.30)" value="− $3.64" />
              <FeeRow label="You receive" value="~$105.61" highlight />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              ✅ The 5% fee and Stripe fee apply to the combined item + shipping total — not added on top for the buyer. If you set shipping to $0, the buyer pays only item price + tax.
            </p>
          </div>

          {/* Payout timing */}
          <Section icon={CreditCard} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" title="When You Get Paid">
            <p className="text-muted-foreground mb-2">
              Payments are held by Stripe until the transaction is complete. Funds are released when:
            </p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Shipped orders:</strong> Carrier confirms delivery, or buyer confirms receipt</li>
              <li><strong>Local pickup:</strong> Buyer confirms pickup in the app, or automatically after 3 business days with no dispute</li>
            </ul>
            <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
              <strong>⚡ Stripe setup required:</strong> After agreeing, you'll connect a Stripe payout account (~2 min). You'll need a bank account or debit card for deposits.
            </div>
          </Section>

          {/* Shipping */}
          <Section icon={Truck} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600" title="Shipping Options — You're in Control">
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Flat shipping rate:</strong> Set a single shipping cost added to the item price at checkout (e.g. $15 flat)</li>
              <li><strong>Tiered shipping by quantity:</strong> Set different shipping prices for different quantities (e.g. 1–2 items = $15, 3–5 items = $20)</li>
              <li><strong>Minimum order quantity:</strong> Require buyers to purchase at least a set number of items</li>
              <li><strong>Minimum order amount:</strong> Require a minimum dollar amount before checkout</li>
              <li>The shipping cost you set is charged to the buyer on top of the item price</li>
              <li>Package items safely — especially live animals — and choose a reliable carrier</li>
              <li>Enter a tracking number in your Orders dashboard after shipment</li>
              <li>Honor your stated DOA / arrival policy</li>
            </ul>
          </Section>

          {/* Seller responsibilities */}
          <Section icon={CheckCircle2} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600" title="Your Responsibilities">
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Post accurate descriptions and real photos of the actual item</li>
              <li>Ship or arrange pickup within a reasonable timeframe after payment</li>
              <li>Comply with all laws regarding the sale and transport of live animals</li>
              <li>Provide an accurate pickup address and honor your stated pickup windows</li>
            </ul>
          </Section>

          {/* Prohibited */}
          <Section icon={AlertTriangle} iconBg="bg-destructive/10" iconColor="text-destructive" title="Prohibited Items">
            <p className="text-muted-foreground">
              Illegal species, stolen goods, endangered/protected animals, and misrepresented items are strictly prohibited and will result in immediate account suspension.
            </p>
          </Section>

        </div>

        {/* Sticky footer */}
        <div className="px-5 pt-3 pb-5 shrink-0 border-t border-border space-y-3 bg-card rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary shrink-0"
            />
            <span className="text-sm text-foreground leading-snug">
              I understand that <strong>Reef Market's 5% fee and Stripe's processing fee are deducted from my payout</strong>. Fees apply to the full item + shipping total. I am responsible for shipping costs and agree to all terms above.
            </span>
          </label>
          <Button
            className="w-full h-12 rounded-xl font-bold"
            disabled={!checked}
            onClick={onAgree}
          >
            I Agree — Continue to Payout Setup
          </Button>
        </div>

      </div>
    </div>
  );
}