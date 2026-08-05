import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getAdminStats } from "@/lib/server/admin";

export default async function AdminOverviewPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/browse");

  const stats = await getAdminStats();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Listings" value={stats.listings.active} />
        <StatCard label="Pending Approval" value={stats.listings.pending_approval} />
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Pending Reports" value={stats.reports.pending} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminNavCard
          href="/admin/listings"
          title="Listings"
          description={`${stats.listings.total} total · ${stats.listings.pending_approval} awaiting approval`}
        />
        <AdminNavCard
          href="/admin/reports"
          title="Reports"
          description={`${stats.reports.pending} pending triage`}
        />
        <AdminNavCard href="/admin/users" title="Users" description={`${stats.users.total} registered`} />
        <AdminNavCard
          href="/admin/orders"
          title="Orders"
          description={`${stats.orders.total} total · ${stats.orders.doa_claim} refund/credit`}
        />
        <AdminNavCard href="/admin/announcements" title="Announcements" description="Broadcast banner shown on app load" />
        <AdminNavCard href="/admin/help-content" title="Learn Content" description="Care guides shown on the mobile Learn tab" />
        <AdminNavCard href="/admin/promo-codes" title="Promo Codes" description="Bonus listings & free membership grants" />
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>
          Visitors: {stats.visitors.total} total · {stats.visitors.last7Days} in the last 7 days ·{" "}
          {stats.visitors.last30Days} in the last 30 days
        </p>
        <p className="mt-1">
          Listing breakdown: {stats.listings.active} active, {stats.listings.sold} sold, {stats.listings.removed} removed
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function AdminNavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  );
}
