"use client";

import { useEffect, useMemo, useState } from "react";
import { listSellerPayoutAccounts, type SellerPayoutStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

type StatusFilter = "all" | "enabled" | "verifying" | "incomplete";

function statusOf(account: SellerPayoutStatus): { label: string; className: string; filter: StatusFilter } {
  if (account.payouts_enabled) return { label: "Payouts Enabled", className: "bg-emerald-100 text-emerald-700", filter: "enabled" };
  if (account.onboarding_complete) return { label: "Verifying", className: "bg-amber-100 text-amber-700", filter: "verifying" };
  return { label: "Onboarding Incomplete", className: "bg-gray-100 text-gray-600", filter: "incomplete" };
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "enabled", label: "Payouts Enabled" },
  { value: "verifying", label: "Verifying" },
  { value: "incomplete", label: "Incomplete" },
];

export function SellerPayoutsTable() {
  const [accounts, setAccounts] = useState<SellerPayoutStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    listSellerPayoutAccounts(apiClient)
      .then((res) => setAccounts(res.accounts))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? accounts : accounts.filter((a) => statusOf(a).filter === filter)),
    [accounts, filter]
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              filter === f.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No sellers match this filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((account) => {
            const status = statusOf(account);
            return (
              <div key={account.user_id} className="rounded-xl border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{account.user_display_name || account.user_email || account.user_id}</p>
                  {account.user_display_name && account.user_email && (
                    <p className="text-xs text-gray-400 truncate">{account.user_email}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Updated {new Date(account.updated_at).toLocaleDateString()}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
