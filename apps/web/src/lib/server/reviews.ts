import type { Review, ReviewCreateInput } from "@reef-market/shared";
import { OrderError } from "./orders";
import { supabaseAdmin } from "./supabase-admin";

export interface ReviewWithReviewer extends Review {
  reviewer: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

export interface SellerReviewSummary {
  reviews: ReviewWithReviewer[];
  averageRating: number | null;
  count: number;
}

/**
 * Gated on a completed order (SYSTEM_ANALYSIS.md SS3.10: "only after order
 * completion", flagged there as unverified against the legacy source but the
 * only sane rule to enforce for real — the legacy submitReview function's
 * actual validation logic wasn't recoverable from the export). Only
 * "seller_review" (buyer reviews seller) is supported: reviewCreateSchema has
 * no listing-level buyer identifier, and a listing can have multiple
 * completed orders from different buyers, so there's no reliable way to
 * resolve a single "the buyer" for the symmetric "buyer_review" case without
 * an order_id on the row — out of scope for this pass.
 */
export async function createReview(reviewerId: string, input: ReviewCreateInput): Promise<Review> {
  const db = supabaseAdmin();

  const { data: order, error: orderError } = await db
    .from("orders")
    .select("seller_id")
    .eq("listing_id", input.listing_id)
    .eq("buyer_id", reviewerId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) throw new OrderError("You can only review listings you've completed a purchase on", 403);

  const { data, error } = await db
    .from("reviews")
    .insert({
      listing_id: input.listing_id,
      seller_id: order.seller_id,
      reviewer_id: reviewerId,
      rating: input.rating,
      comment: input.comment ?? null,
      type: "seller_review",
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new OrderError("You've already reviewed this listing", 409);
    throw error;
  }
  return data as Review;
}

export async function listReviewsForSeller(sellerId: string): Promise<SellerReviewSummary> {
  const db = supabaseAdmin();
  const { data: reviews, error } = await db
    .from("reviews")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("type", "seller_review")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!reviews || reviews.length === 0) return { reviews: [], averageRating: null, count: 0 };

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: profiles } = await db.from("profiles").select("id, display_name, avatar_url").in("id", reviewerIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    reviews: reviews.map((r) => ({ ...(r as Review), reviewer: profileMap.get(r.reviewer_id) ?? null })),
    averageRating,
    count: reviews.length,
  };
}

export interface AdminReview extends Review {
  reviewer: { id: string; display_name: string | null; email: string } | null;
  seller: { id: string; display_name: string | null; email: string } | null;
  listing: { id: string; title: string } | null;
}

export interface AdminReviewListParams {
  /** Reviews only show up as an aggregate average today — no way to find and remove a fake or abusive one. Defaults to unfiltered, newest first; maxRating narrows to the low-star reviews most likely to need a look. */
  maxRating?: number;
  /** Reviews this one user gave or received — either side of the review. */
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function listAdminReviews(params: AdminReviewListParams): Promise<{ reviews: AdminReview[]; total: number }> {
  const db = supabaseAdmin();
  let query = db.from("reviews").select("*", { count: "exact" });
  if (params.maxRating) query = query.lte("rating", params.maxRating);
  if (params.userId) query = query.or(`reviewer_id.eq.${params.userId},seller_id.eq.${params.userId}`);

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: reviews, error, count } = await query;
  if (error) throw error;
  if (!reviews || reviews.length === 0) return { reviews: [], total: count ?? 0 };

  const profileIds = [...new Set(reviews.flatMap((r) => [r.reviewer_id, r.seller_id]))];
  const listingIds = [...new Set(reviews.map((r) => r.listing_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    db.from("profiles").select("id, display_name, email").in("id", profileIds),
    listingIds.length
      ? db.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));

  return {
    reviews: reviews.map((r) => ({
      ...(r as Review),
      reviewer: profileMap.get(r.reviewer_id) ?? null,
      seller: profileMap.get(r.seller_id) ?? null,
      listing: r.listing_id ? listingMap.get(r.listing_id) ?? null : null,
    })),
    total: count ?? reviews.length,
  };
}

export async function deleteReview(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

/** Completed orders the buyer hasn't reviewed yet — drives "Leave a review" prompts. */
export async function hasReviewed(reviewerId: string, listingId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId)
    .eq("listing_id", listingId)
    .eq("type", "seller_review")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
