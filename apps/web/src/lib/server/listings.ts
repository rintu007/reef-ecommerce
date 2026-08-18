import type { Listing } from "@reef-market/shared";
import type { AuthUser } from "./auth";
import { supabaseAdmin } from "./supabase-admin";

export interface ListingLimitStatus {
  allowed: boolean;
  usage: { active: number; max: number }; // max: -1 = unlimited
}

export interface ListingQueryParams {
  /** Exact-ID batch lookup (e.g. cart rehydration) — one round trip instead of N. */
  ids?: string[];
  sellerId?: string;
  status?: string;
  market?: "saltwater" | "freshwater";
  listingType?: string;
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  shipping?: "local_pickup" | "shipping";
  featured?: boolean;
  sort?: "newest" | "price_low" | "price_high" | "featured";
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  limit?: number;
  offset?: number;
}

function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Shared by GET /api/listings and Server Components alike (see api-client.ts:
 * "web Server Components skip [the HTTP client] and call apps/web/lib/server/*
 * in-process instead"). `market` matches that market OR "both" in one query —
 * see SYSTEM_ANALYSIS.md §3.2, the merge-by-market rule to preserve exactly.
 */
export async function queryListings(
  params: ListingQueryParams,
  viewer: AuthUser | null
): Promise<{ listings: Listing[]; total: number }> {
  const isOwnerOrAdmin = !!viewer && (viewer.role === "admin" || viewer.id === params.sellerId);

  const db = supabaseAdmin();
  let query = db.from("listings").select("*", { count: "exact" });

  if (params.sellerId) query = query.eq("seller_id", params.sellerId);
  if (params.ids && params.ids.length > 0) query = query.in("id", params.ids);

  // Hides listings from sellers the viewer has blocked — only applied to the
  // general browse feed, not when a specific seller's storefront is requested.
  if (viewer && !params.sellerId) {
    const { data: blocked } = await db.from("blocked_users").select("blocked_id").eq("blocker_id", viewer.id);
    const blockedIds = (blocked ?? []).map((b) => b.blocked_id as string);
    if (blockedIds.length > 0) query = query.not("seller_id", "in", `(${blockedIds.join(",")})`);
  }

  if (isOwnerOrAdmin) {
    if (params.status) query = query.eq("status", params.status);
  } else if (!params.ids) {
    // Public browse: only ever show active listings. Explicit ID lookups
    // (cart rehydration) bypass this — the caller already knows which IDs it
    // wants and needs them regardless of status (sold out, etc.) to render
    // "remove this" UI correctly.
    query = query.eq("status", "active");
  }

  if (params.market) {
    query = query.in("market", [params.market, "both"]);
  }

  if (params.listingType) query = query.eq("listing_type", params.listingType);
  if (params.category) query = query.eq("category", params.category);

  if (params.q) {
    const term = escapeIlike(params.q);
    query = query.or(
      `title.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%,species_name.ilike.%${term}%`
    );
  }

  if (params.minPrice !== undefined) query = query.gte("price", params.minPrice);
  if (params.maxPrice !== undefined) query = query.lte("price", params.maxPrice);

  if (params.shipping === "local_pickup") query = query.eq("local_pickup", true);
  else if (params.shipping === "shipping") query = query.eq("shipping_available", true);

  if (params.featured) query = query.eq("featured", true);

  // Distance search only applies to local-pickup listings (matches legacy —
  // see `nearby_listing_ids`'s own local_pickup filter), so this narrows the
  // result set further regardless of the `shipping` param above.
  let distanceOrder: string[] | null = null;
  if (params.lat !== undefined && params.lng !== undefined && params.radiusMiles !== undefined) {
    const { data: nearby, error: nearbyError } = await db.rpc("nearby_listing_ids", {
      p_lat: params.lat,
      p_lng: params.lng,
      p_radius_miles: params.radiusMiles,
    });
    if (nearbyError) throw nearbyError;
    const nearbyIds = ((nearby ?? []) as { id: string; distance_miles: number }[]).map((r) => r.id);
    if (nearbyIds.length === 0) return { listings: [], total: 0 };
    query = query.in("id", nearbyIds);
    distanceOrder = nearbyIds;
  }

  switch (params.sort) {
    case "price_low":
      query = query.order("price", { ascending: true });
      break;
    case "price_high":
      query = query.order("price", { ascending: false });
      break;
    case "featured":
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  let listings = (data ?? []) as Listing[];
  if (distanceOrder && !params.sort) {
    const rank = new Map(distanceOrder.map((id, i) => [id, i]));
    listings = [...listings].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }

  return { listings, total: count ?? data?.length ?? 0 };
}

export async function getListingById(id: string, viewer: AuthUser | null): Promise<Listing | null> {
  const db = supabaseAdmin();
  const { data: listing, error } = await db.from("listings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!listing) return null;

  const isOwnerOrAdmin = !!viewer && (viewer.id === listing.seller_id || viewer.role === "admin");
  if (listing.status !== "active" && !isOwnerOrAdmin) return null;

  return listing as Listing;
}

/**
 * Enforces plan-based active-listing caps (free=5, pro/business=unlimited)
 * plus profiles.bonus_listing_slots on top — see SYSTEM_ANALYSIS.md §5.2/§5.3:
 * the legacy `checkListingLimit` function was a no-op and `bonus_listing_slots`
 * was written but never read. Both are wired up for real here per product decision.
 */
export async function getListingLimitStatus(userId: string): Promise<ListingLimitStatus> {
  const db = supabaseAdmin();

  const [{ data: subscription }, { data: profile }, { count: activeCount }] = await Promise.all([
    db
      .from("user_subscriptions")
      .select("plan_slug")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle(),
    db.from("profiles").select("bonus_listing_slots").eq("id", userId).single(),
    db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", userId).eq("status", "active"),
  ]);

  const planSlug = subscription?.plan_slug ?? "free";
  const { data: plan } = await db
    .from("membership_plans")
    .select("max_active_listings")
    .eq("slug", planSlug)
    .single();

  const baseMax = plan?.max_active_listings ?? 5;
  const bonusSlots = profile?.bonus_listing_slots ?? 0;
  const max = baseMax === -1 ? -1 : baseMax + bonusSlots;
  const active = activeCount ?? 0;

  return {
    allowed: max === -1 || active < max,
    usage: { active, max },
  };
}
