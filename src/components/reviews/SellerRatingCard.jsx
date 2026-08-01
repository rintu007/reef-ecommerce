import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";

export default function SellerRatingCard({ sellerEmail, compact = false }) {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sellerStats", sellerEmail],
    queryFn: () => base44.functions.invoke("getSellerStats", { sellerEmail }),
    enabled: !!sellerEmail && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stats_data = stats?.data || {};
  const rating = stats_data.averageRating || 0;
  const totalReviews = stats_data.totalReviews || 0;
  const completedSales = stats_data.completedSales || 0;

  if (isLoading) {
    return <Skeleton className="h-16 rounded-lg" />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span className="font-semibold">{rating > 0 ? rating : "New"}</span>
        </div>
        {totalReviews > 0 && (
          <span className="text-muted-foreground">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm mb-1">Seller Rating</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(rating)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-lg">{rating > 0 ? rating : "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Reviews</p>
          <p className="font-bold">{totalReviews}</p>
        </div>
        <div className="bg-muted rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Completed Sales</p>
          <p className="font-bold">{completedSales}</p>
        </div>
      </div>

      {totalReviews === 0 && (
        <p className="text-xs text-muted-foreground italic">No reviews yet</p>
      )}
    </div>
  );
}