import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export default function SubmitReviewModal({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const res = await base44.functions.invoke("submitReview", {
      orderId: order.id,
      sellerEmail: order.seller_email,
      listingId: order.listing_id,
      rating,
      comment
    });

    if (res.data?.success) {
      toast.success("Review submitted!");
      onSuccess();
      onClose();
    } else {
      toast.error(res.data?.error || "Failed to submit review");
    }
    setLoading(false);
  };

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }} shouldScaleBackground={false}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>Rate Your Purchase</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Item summary */}
          <div className="flex gap-3 bg-muted rounded-lg p-3">
            {order.listing_photo && (
              <img src={order.listing_photo} alt="" className="w-12 h-12 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{order.listing_title}</p>
              <p className="text-xs text-muted-foreground">Sold by {order.seller_email}</p>
            </div>
          </div>

          {/* Rating selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">How would you rate this seller?</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform active:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground font-medium">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Add a comment (optional)</label>
            <Textarea
              placeholder="Share details about your experience — packaging, condition, communication, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-lg"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/500</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}