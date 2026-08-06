import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getAdminAnalytics } from "@/lib/server/admin";
import { ListingStatusPie, OrderStatusPie } from "@/components/admin/AnalyticsPies";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default async function SalesAnalyticsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  const analytics = await getAdminAnalytics();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sales Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`$${analytics.orders.revenue.total.toFixed(2)}`} />
        <StatCard label="Total Orders" value={String(analytics.orders.total)} />
        <StatCard label="Completed" value={String(analytics.orders.completed)} />
        <StatCard label="Avg Order" value={`$${analytics.orders.revenue.avg.toFixed(2)}`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="font-semibold text-sm mb-2">Order Status</p>
          <OrderStatusPie completed={analytics.orders.completed} pending={analytics.orders.pending} />
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="font-semibold text-sm mb-2">Listing Status</p>
          <ListingStatusPie active={analytics.listings.active} sold={analytics.listings.sold} removed={analytics.listings.removed} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 bg-white mb-8">
        <p className="font-semibold text-sm mb-3">Revenue by Order Status</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Completed</p>
            <p className="font-semibold">${analytics.orders.revenue.byStatus.completed.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Pending</p>
            <p className="font-semibold">${analytics.orders.revenue.byStatus.pending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Cancelled</p>
            <p className="font-semibold">${analytics.orders.revenue.byStatus.cancelled.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-semibold text-sm mb-3">Activity (Last 30 Days)</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="New Orders" value={String(analytics.recentActivity.ordersLast30Days)} />
          <StatCard label="New Listings" value={String(analytics.recentActivity.listingsLast30Days)} />
          <StatCard label="New Users" value={String(analytics.recentActivity.usersLast30Days)} />
        </div>
      </div>
    </div>
  );
}
