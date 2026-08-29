import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getAdminAnalytics } from "@/lib/server/admin";
import { TopPagesList } from "@/components/admin/TopPagesList";
import { VisitsByDayChart } from "@/components/admin/VisitsChart";
import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { rowsToCsv } from "@/lib/csv";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default async function AppAnalyticsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  const analytics = await getAdminAnalytics();

  const csv = rowsToCsv([
    ["Summary", ""],
    ["Total Users", analytics.users.total],
    ["Total Listings", analytics.listings.total],
    ["Listings — Active", analytics.listings.active],
    ["Listings — Sold", analytics.listings.sold],
    ["Listings — Removed", analytics.listings.removed],
    ["Total Orders", analytics.orders.total],
    ["Orders — Completed", analytics.orders.completed],
    ["Orders — Pending", analytics.orders.pending],
    ["Total Reviews", analytics.reviews.total],
    ["Avg Rating", analytics.reviews.avgRating != null ? analytics.reviews.avgRating.toFixed(2) : ""],
    ["Total Page Views", analytics.visitors.total],
    ["Unique Sessions", analytics.visitors.uniqueSessions],
    ["Views Today", analytics.visitors.today],
    ["Views Last 7 Days", analytics.visitors.last7Days],
    ["Signed-In Sessions", analytics.visitors.authSessions],
    ["Guest Sessions", analytics.visitors.guestSessions],
    ["New Orders (30 days)", analytics.recentActivity.ordersLast30Days],
    ["New Listings (30 days)", analytics.recentActivity.listingsLast30Days],
    ["New Users (30 days)", analytics.recentActivity.usersLast30Days],
    [],
    ["Views per Day (last 30 days)", ""],
    ["Date", "Views"],
    ...analytics.visitors.visitsByDay.map((d) => [d.date, d.count]),
    [],
    ["Top Pages", ""],
    ["Path", "Views"],
    ...analytics.visitors.topPages.map((p) => [p.path, p.count]),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">App Analytics</h1>
        <CsvExportButton filename="app-analytics.csv" csv={csv} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={String(analytics.users.total)} />
        <StatCard label="Total Listings" value={String(analytics.listings.total)} />
        <StatCard label="Total Orders" value={String(analytics.orders.total)} />
        <StatCard label="Avg Rating" value={analytics.reviews.avgRating != null ? analytics.reviews.avgRating.toFixed(1) : "—"} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="font-semibold text-sm mb-3">Listings Breakdown</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Active</span>
              <span className="font-semibold">{analytics.listings.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sold</span>
              <span className="font-semibold">{analytics.listings.sold}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Removed</span>
              <span className="font-semibold">{analytics.listings.removed}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="font-semibold text-sm mb-3">Order Breakdown</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Completed</span>
              <span className="font-semibold">{analytics.orders.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pending</span>
              <span className="font-semibold">{analytics.orders.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Reviews</span>
              <span className="font-semibold">{analytics.reviews.total}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 bg-white mb-8">
        <p className="font-semibold text-sm mb-3">Visitor Stats</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
          <StatCard label="Total Page Views" value={String(analytics.visitors.total)} />
          <StatCard label="Unique Sessions" value={String(analytics.visitors.uniqueSessions)} />
          <StatCard label="Today" value={String(analytics.visitors.today)} />
          <StatCard label="Last 7 Days" value={String(analytics.visitors.last7Days)} />
          <StatCard label="Signed-In Sessions" value={String(analytics.visitors.authSessions)} />
          <StatCard label="Guest Sessions" value={String(analytics.visitors.guestSessions)} />
        </div>

        <p className="text-xs font-semibold text-gray-500 mb-2">Views per Day (last 30 days)</p>
        <VisitsByDayChart data={analytics.visitors.visitsByDay} />

        <p className="text-xs font-semibold text-gray-500 mt-4 mb-2">Top Pages</p>
        <TopPagesList pages={analytics.visitors.topPages} />
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
