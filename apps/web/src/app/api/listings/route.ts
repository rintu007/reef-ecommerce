import { NextResponse, after } from "next/server";
import { listingCreateSchema, type Listing } from "@reef-market/shared";
import { getAuthenticatedUser, requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getListingLimitStatus, queryListings, type ListingQueryParams } from "@/lib/server/listings";
import { geocodeLocation } from "@/lib/server/geocode";
import { notifyMatchingSavedSearches } from "@/lib/server/saved-searches";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

/** Public listing browse/search. Replaces base44/functions/getPublicListings. */
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);

    const market = searchParams.get("market");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const shipping = searchParams.get("shipping");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusMiles = searchParams.get("radius_miles");

    const idsParam = searchParams.get("ids");

    const params: ListingQueryParams = {
      ids: idsParam ? idsParam.split(",").filter(Boolean) : undefined,
      sellerId: searchParams.get("seller_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      market: market === "saltwater" || market === "freshwater" ? market : undefined,
      listingType: searchParams.get("listing_type") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      shipping: shipping === "local_pickup" || shipping === "shipping" ? shipping : undefined,
      featured: searchParams.get("featured") === "true",
      sort: (searchParams.get("sort") as ListingQueryParams["sort"]) ?? undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radiusMiles: radiusMiles ? Number(radiusMiles) : undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    };

    const { listings, total } = await queryListings(params, user);
    return NextResponse.json({ listings, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * Create a listing. Enforces the plan-based active-listing cap (see
 * lib/server/listings.ts) — SYSTEM_ANALYSIS.md §5.2 decision: enforce for real
 * rather than reproducing the legacy no-op.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const input = listingCreateSchema.parse(body);

    const limitStatus = await getListingLimitStatus(user.id);
    if (!limitStatus.allowed) {
      return apiError(
        `Active listing limit reached (${limitStatus.usage.active}/${limitStatus.usage.max})`,
        403
      );
    }

    const geocoded = input.local_pickup && input.location ? await geocodeLocation(input.location) : null;

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("listings")
      .insert({
        ...input,
        seller_id: user.id,
        status: "active",
        latitude: geocoded?.lat ?? null,
        longitude: geocoded?.lng ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    // Legacy parity: reef-trade-flow's notifyMatchingSavedSearches automation.
    // `after()` runs this once the response has been sent, without blocking
    // the caller's listing creation on email delivery — and unlike a plain
    // unawaited promise, Vercel's serverless runtime is guaranteed to keep
    // the function alive until it finishes, not kill it right after the
    // response flushes. A failure here must never surface as a listing
    // creation error.
    after(() => notifyMatchingSavedSearches(data as Listing).catch((err) => console.error("notifyMatchingSavedSearches failed", err)));

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
