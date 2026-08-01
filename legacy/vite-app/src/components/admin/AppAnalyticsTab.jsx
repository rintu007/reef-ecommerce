import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Package, TrendingUp, Star } from "lucide-react";
import VisitorStatsSection from "./VisitorStatsSection";

export default function AppAnalyticsTab() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => base44.functions.invoke("getAdminAnalytics", {}),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const data = analytics?.data;
  if (!data) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* Platform Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <p className="text-2xl font-bold">{data.users.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </div>
          <p className="text-2xl font-bold">{data.listings.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <p className="text-2xl font-bold">{data.orders.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
          <p className="text-2xl font-bold">{data.reviews.avgRating}</p>
        </div>
      </div>

      {/* Listing Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Listings Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Active Listings</span>
            <span className="font-semibold text-blue-600">{data.listings.active}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Sold Listings</span>
            <span className="font-semibold text-emerald-600">{data.listings.sold}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Removed Listings</span>
            <span className="font-semibold text-red-600">{data.listings.removed}</span>
          </div>
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Order Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed Orders</span>
            <span className="font-semibold text-emerald-600">{data.orders.completed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Pending Orders</span>
            <span className="font-semibold text-amber-600">{data.orders.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Reviews</span>
            <span className="font-semibold">{data.reviews.total}</span>
          </div>
        </div>
      </div>

      {/* Visitor Traffic */}
      <VisitorStatsSection visitors={data.visitors} />

      {/* Activity Last 30 Days */}
      <div className="bg-muted rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Activity (Last 30 Days)</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">New Orders</span>
            <span className="font-semibold">{data.recentActivity.ordersLast30Days}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">New Listings</span>
            <span className="font-semibold">{data.recentActivity.listingsLast30Days}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">New Users</span>
            <span className="font-semibold">{data.recentActivity.usersLast30Days}</span>
          </div>
        </div>
      </div>
    </div>
  );
}