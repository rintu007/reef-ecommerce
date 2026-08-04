"use client";

import { useState } from "react";
import { createReview } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function ReviewForm({ listingId }: { listingId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createReview(apiClient, { listing_id: listingId, rating, comment: comment || undefined });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="text-sm text-emerald-600 pt-3 border-t border-gray-200">Thanks for your review!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 border-t border-gray-200 space-y-2">
      <p className="text-sm font-semibold">Leave a Review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${star <= rating ? "opacity-100" : "opacity-30"}`}
            aria-label={`${star} star`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Optional comment"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
