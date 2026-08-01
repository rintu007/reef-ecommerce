import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { toast } from "sonner";

export default function SellerRatingModal({ order, me, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSaving(true);
    await base44.entities.Review.create({
      listing_id: order.listing_id,
      seller_email: order.seller_email,
      reviewer_email: me.email,
      reviewer_name: me.full_name || me.email,
      rating,
      comment,
      type: "seller_review",
    });
    toast.success("Review submitted!");
    onSuccess();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Rate Your Seller</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-1 truncate">
          Order: <span className="font-medium text-foreground">{order.listing_title}</span>
        </div>

        {/* Star selector */}
        <div className="flex gap-1 my-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  n <= (hovered || rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
        </div>

        <Textarea
          placeholder="Optional comment about the seller or item quality..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="rounded-xl text-sm"
          rows={3}
        />

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 rounded-xl" onClick={submit} disabled={saving || !rating}>
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}