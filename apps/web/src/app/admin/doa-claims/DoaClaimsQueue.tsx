"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listDoaClaims, type AdminDoaClaim, type DoaClaimReviewStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { markAdminBadgeSeen } from "@/components/admin/NewSinceBadge";

const STATUS_TABS: { value: DoaClaimReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "all", label: "All" },
];

export function DoaClaimsQueue() {
  const [status, setStatus] = useState<DoaClaimReviewStatus | "all">("pending");
  const [claims, setClaims] = useState<AdminDoaClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { claims, total } = await listDoaClaims(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setClaims(claims);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      listDoaClaims(apiClient, { status: "pending", limit: 1 }).then(({ total }) => markAdminBadgeSeen("doa_claims", total));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

      <p className="text-xs text-gray-400 mb-2">{total} claim{total === 1 ? "" : "s"}</p>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : claims.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No claims in this view.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/orders/${claim.id}`}
              className="block rounded-xl border border-gray-200 p-3 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{claim.listing_title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Buyer: {claim.buyer?.display_name ?? claim.buyer?.email ?? "unknown"} · Seller:{" "}
                    {claim.seller?.display_name ?? claim.seller?.email ?? "unknown"}
                  </p>
                  {claim.doa_claim_reason && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{claim.doa_claim_reason}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    ${claim.total_charged?.toFixed(2) ?? claim.price.toFixed(2)}
                    {claim.doa_claim_photos.length > 0 && ` · ${claim.doa_claim_photos.length} photo${claim.doa_claim_photos.length === 1 ? "" : "s"}`}
                    {claim.doa_claim_filed_at && ` · filed ${new Date(claim.doa_claim_filed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    claim.doa_claim_status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : claim.doa_claim_status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {claim.doa_claim_status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
