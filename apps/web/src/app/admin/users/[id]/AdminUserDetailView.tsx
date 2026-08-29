"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminUserDetail, type AdminUserDetail } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white mb-4">
      <p className="font-semibold text-sm mb-3">{title}</p>
      {children}
    </div>
  );
}

export function AdminUserDetailView({ id }: { id: string }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      getAdminUserDetail(apiClient, id)
        .then(setDetail)
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load user"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!detail) return null;

  const { profile, listings, ordersAsBuyer, ordersAsSeller, subscription, reviews, reports, blockedRelationships } = detail;

  return (
    <div>
      <Section title="Profile">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{profile.display_name ?? "Unnamed"}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <p>Role: <span className="font-semibold capitalize">{profile.role}</span></p>
          <p>Verified seller: <span className="font-semibold">{profile.verified_seller ? "Yes" : "No"}</span></p>
          <p>Completed sales: <span className="font-semibold">{profile.completed_sales_count}</span></p>
          <p>Bonus listing slots: <span className="font-semibold">{profile.bonus_listing_slots}</span></p>
          <p>Joined: <span className="font-semibold">{new Date(profile.created_at).toLocaleDateString()}</span></p>
          <p>Location: <span className="font-semibold">{profile.location ?? "—"}</span></p>
        </div>
        <Link href={`/sellers/${profile.id}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          View public storefront →
        </Link>
      </Section>

      <Section title={`Subscription — ${subscription.plan.name}`}>
        {subscription.subscription ? (
          <p className="text-xs text-gray-600">
            Status: <span className="font-semibold capitalize">{subscription.subscription.status}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400">No active subscription (free plan).</p>
        )}
      </Section>

      <Section title={`Listings (${listings.length})`}>
        {listings.length === 0 ? (
          <p className="text-xs text-gray-400">No listings.</p>
        ) : (
          <div className="space-y-1.5">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs">
                <Link href={`/listings/${l.id}`} className="hover:underline truncate">
                  {l.title}
                </Link>
                <span className="text-gray-400 shrink-0 ml-2">{l.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Orders as buyer (${ordersAsBuyer.length})`}>
        {ordersAsBuyer.length === 0 ? (
          <p className="text-xs text-gray-400">No orders.</p>
        ) : (
          <div className="space-y-1.5">
            {ordersAsBuyer.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <Link href={`/orders/${o.id}`} className="hover:underline truncate">
                  {o.listing_title}
                </Link>
                <span className="text-gray-400 shrink-0 ml-2">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Orders as seller (${ordersAsSeller.length})`}>
        {ordersAsSeller.length === 0 ? (
          <p className="text-xs text-gray-400">No orders.</p>
        ) : (
          <div className="space-y-1.5">
            {ordersAsSeller.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <Link href={`/orders/${o.id}`} className="hover:underline truncate">
                  {o.listing_title}
                </Link>
                <span className="text-gray-400 shrink-0 ml-2">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Reviews given or received (${reviews.length})`}>
        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400">No reviews.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="text-xs">
                <span className="font-semibold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>{" "}
                <span className="text-gray-500">
                  {r.reviewer_id === profile.id ? "gave to" : "received from"}{" "}
                  {r.reviewer_id === profile.id ? r.seller?.display_name ?? r.seller?.email : r.reviewer?.display_name ?? r.reviewer?.email}
                </span>
                {r.comment && <p className="text-gray-600 mt-0.5">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Reports involving this user (${reports.length})`}>
        {reports.length === 0 ? (
          <p className="text-xs text-gray-400">No reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="text-xs">
                <p className="text-gray-500 uppercase font-semibold text-[10px]">
                  {r.report_type} · {r.status} · {r.reporter_id === profile.id ? "filed by this user" : "filed against this user"}
                </p>
                <p className="text-gray-700">{r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Blocked-user relationships (${blockedRelationships.length})`}>
        {blockedRelationships.length === 0 ? (
          <p className="text-xs text-gray-400">Not involved in any blocks.</p>
        ) : (
          <div className="space-y-1.5">
            {blockedRelationships.map((b) => (
              <p key={b.id} className="text-xs text-gray-600">
                {b.blocker_id === profile.id
                  ? `Blocked ${b.blocked?.display_name ?? b.blocked?.email ?? "unknown"}`
                  : `Blocked by ${b.blocker?.display_name ?? b.blocker?.email ?? "unknown"}`}
              </p>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
