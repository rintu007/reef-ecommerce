import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingRow } from "@/components/ListingRow";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryListings } from "@/lib/server/listings";
import { getSellerDashboardMetrics } from "@/lib/server/orders";

export default async function MyListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const [{ listings }, metrics] = await Promise.all([
    queryListings({ sellerId: user.id, sort: "newest", limit: 200 }, user),
    getSellerDashboardMetrics(user.id),
  ]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/sell/fee-calculator"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Fee Calculator
          </Link>
          <Link
            href="/sell"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* Legacy parity: reef-trade-flow's SellerDashboard.jsx "at a glance" metrics grid. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold">{metrics.activeListings}</p>
          <p className="text-xs text-gray-500 mt-1">Active listings</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">${metrics.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Completed sales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-700">{metrics.pendingOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Orders need attention</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">{metrics.totalViews}</p>
          <p className="text-xs text-gray-500 mt-1">Total views</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-500 text-center py-16">You haven&apos;t created any listings yet.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
