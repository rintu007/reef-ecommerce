import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function RecentReviewsList({ sellerEmail }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sellerStats", sellerEmail],
    queryFn: () => base44.functions.invoke("getSellerStats", { sellerEmail }),
    enabled: !!sellerEmail,
    staleTime: 1000 * 60 * 5,
  });

  const reviews = stats?.data?.reviews || [];

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No reviews yet</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="bg-card rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold text-sm">{review.reviewer_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}