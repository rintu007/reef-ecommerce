import { NextResponse } from "next/server";
import { listingCreateSchema } from "@reef-market/shared";
import { getAuthenticatedUser, requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getListingLimitStatus, queryListings, type ListingQueryParams } from "@/lib/server/listings";
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

    const params: ListingQueryParams = {
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

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("listings")
      .insert({ ...input, seller_id: user.id, status: "active" })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
