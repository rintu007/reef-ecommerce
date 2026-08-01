import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { safeStorage } from "@/lib/safe-storage";

const FEATURED_AGREED_KEY = "reef_featured_fee_agreed_v1";

function calcFee(price) {
  const pct = parseFloat(price) * 0.01;
  return Math.max(pct, 0.99).toFixed(2);
}

export default function FeaturedListingToggle({ value, onChange, price }) {
  const [showModal, setShowModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const alreadyAgreed = !!safeStorage.getItem(FEATURED_AGREED_KEY);

  const fee = calcFee(price);

  const handleToggle = (checked) => {
    if (!checked) {
      onChange(false);
      return;
    }
    if (alreadyAgreed) {
      onChange(true);
    } else {
      setShowModal(true);
    }
  };

  const handleAgree = () => {
    if (dontShowAgain) {
      safeStorage.setItem(FEATURED_AGREED_KEY, "true");
    }
    onChange(true);
    setShowModal(false);
  };

  const handleDecline = () => {
    setShowModal(false);
    onChange(false);
  };

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <Label className="font-semibold text-sm">Feature this listing</Label>
          </div>
          <Switch checked={value} onCheckedChange={handleToggle} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Featured listings appear at the top of the marketplace for more visibility. A <strong>1% fee</strong> (min $0.99) is deducted from your payout when the item sells.
          {price > 0 && <span className="text-amber-700 dark:text-amber-400 font-semibold"> At your price of ${parseFloat(price).toFixed(2)}, the fee would be <strong>${fee}</strong>.</span>}
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h2 className="text-lg font-bold">Featured Listing</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By featuring your listing, it will appear prominently at the top of the marketplace with a ⭐ badge, giving it maximum visibility to buyers.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Fee Agreement</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                When your item sells, <strong>1% of the sale price</strong> (minimum $0.99) will be deducted from your payout. If the item doesn't sell, there is no charge.
              </p>
              {price > 0 && (
                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg px-3 py-2 text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Your listing price: ${parseFloat(price).toFixed(2)} → Featured fee: <strong>${fee}</strong>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">Don't show this again (I understand the fee)</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAgree}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                I Agree — Feature It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}