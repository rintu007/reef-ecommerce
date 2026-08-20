"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminSubscriptions, type AdminSubscription, type SubscriptionStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const STATUS_TABS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-amber-100 text-amber-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 100;

export function AdminSubscriptionsTable() {
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { subscriptions: page, total } = await listAdminSubscriptions(apiClient, {
          status: status === "all" ? undefined : status,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setSubscriptions((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              status === tab.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">{total} subscription{total === 1 ? "" : "s"}</p>

      {loading && subscriptions.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : subscriptions.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No subscriptions match this filter.</p>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 bg-white">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{sub.user_display_name ?? sub.user_email ?? sub.user_id}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sub.plan_slug} · {sub.payment_provider ?? "no provider"}
                  {sub.current_period_end && ` · renews/ends ${sub.current_period_end}`}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[sub.status]}`}>{sub.status}</span>
            </div>
          ))}
        </div>
      )}

      {subscriptions.length < total && (
        <button
          onClick={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
