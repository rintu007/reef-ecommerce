import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getAdminStats } from "@/lib/server/admin";
import { NewSinceBadge } from "@/components/admin/NewSinceBadge";

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
          badge={<NewSinceBadge kind="reports" />}
        />
        <AdminNavCard href="/admin/users" title="Users" description={`${stats.users.total} registered`} />
        <AdminNavCard
          href="/admin/orders"
          title="Orders"
          description={`${stats.orders.total} total · ${stats.orders.doa_claim} refund/credit`}
        />
        <AdminNavCard
          href="/admin/doa-claims"
          title="DOA Claims"
          description="Dead-on-arrival claims queue"
          badge={<NewSinceBadge kind="doa_claims" />}
        />
        <AdminNavCard href="/admin/services" title="Services" description="Provider services — moderate & remove" />
        <AdminNavCard href="/admin/reviews" title="Reviews" description="Find and remove fake or abusive reviews" />
        <AdminNavCard href="/admin/membership-plans" title="Membership Plans" description="Pricing, listing limits & features" />
        <AdminNavCard href="/admin/subscriptions" title="Subscriptions" description="Which users hold which plan, and its status" />
        <AdminNavCard href="/admin/blocked-users" title="Blocked Users" description="Who has blocked whom" />
        <AdminNavCard href="/admin/announcements" title="Announcements" description="Broadcast banner shown on app load" />
        <AdminNavCard href="/admin/help-content" title="Learn Content" description="Care guides shown on the mobile Learn tab" />
        <AdminNavCard href="/admin/promo-codes" title="Promo Codes" description="Bonus listings & free membership grants" />
        <AdminNavCard href="/admin/seller-payouts" title="Seller Payouts" description="Stripe Connect onboarding & payout status" />
        <AdminNavCard href="/admin/sales-analytics" title="Sales Analytics" description="Revenue, order status, and recent activity" />
        <AdminNavCard href="/admin/app-analytics" title="App Analytics" description="Users, listings, reviews, and visitor stats" />
        <AdminNavCard href="/admin/visitor-logs" title="Visitor Logs" description="Raw page-view events by session or user" />
        <AdminNavCard href="/admin/action-log" title="Action Log" description="Every sensitive admin action, who and when" />
        <AdminNavCard href="/api-docs" title="API Docs & Tester" description="Every backend endpoint, with example payloads you can edit and send" />
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

function AdminNavCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
      <p className="font-semibold flex items-center">
        {title}
        {badge}
      </p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  );
}
