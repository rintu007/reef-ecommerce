import { NextResponse } from "next/server";
import { handleRouteError, apiError } from "@/lib/server/http";
import { getPublicProfile } from "@/lib/server/profiles";
import { queryListings } from "@/lib/server/listings";
import { listReviewsForSeller } from "@/lib/server/reviews";

/**
 * Combines what apps/mobile's seller storefront screen needs into one round
 * trip. It used to fire getPublicProfile + listListings + getSellerReviews
 * as three separate requests (still parallel, but each is its own
 * serverless function — three independent cold-start risks instead of one,
 * which is what made the storefront screen intermittently slow). Web's
 * equivalent Server Component never had this problem since it calls
 * lib/server/* in-process; this brings mobile to the same shape.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [profile, { listings }, reviews] = await Promise.all([
      getPublicProfile(id),
      queryListings({ sellerId: id, status: "active", sort: "newest", limit: 48 }, null),
      listReviewsForSeller(id),
    ]);

    if (!profile) return apiError("Profile not found", 404);

    return NextResponse.json({ profile, listings, reviews });
  } catch (error) {
    return handleRouteError(error);
  }
}
