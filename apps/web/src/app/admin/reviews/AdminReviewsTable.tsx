"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { deleteAdminReview, listAdminReviews, type AdminReview } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const RATING_FILTERS: { value: number | "all"; label: string }[] = [
  { value: "all", label: "All ratings" },
  { value: 2, label: "1-2 stars" },
  { value: 1, label: "1 star only" },
];

const PAGE_SIZE = 50;

export function AdminReviewsTable() {
  const [maxRating, setMaxRating] = useState<number | "all">("all");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { reviews: page, total } = await listAdminReviews(apiClient, {
          max_rating: maxRating === "all" ? undefined : maxRating,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setReviews((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [maxRating]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxRating]);

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this review? This can't be undone.")) return;
    setBusyId(id);
    try {
      await deleteAdminReview(apiClient, id);
      await load(0, true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {RATING_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setMaxRating(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              maxRating === f.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">{total} review{total === 1 ? "" : "s"}</p>

      {loading && reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No reviews match this filter.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                    <span className="text-xs font-normal text-gray-400 ml-2">{review.type.replace("_", " ")}</span>
                  </p>
                  {review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {review.reviewer?.display_name ?? review.reviewer?.email ?? "unknown"} on{" "}
                    {review.seller?.display_name ?? review.seller?.email ?? "unknown"}
                    {review.listing && (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/listings/${review.listing.id}`} className="hover:underline">
                          {review.listing.title}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={busyId === review.id}
                  className="shrink-0 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length < total && (
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
