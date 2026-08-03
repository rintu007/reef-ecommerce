import type { Listing } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

export async function listSavedListingIds(userId: string): Promise<string[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("watchlists")
    .select("listing_id")
    .eq("user_id", userId)
    .eq("type", "listing");
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id as string);
}

export async function listSavedListings(userId: string): Promise<Listing[]> {
  const db = supabaseAdmin();
  const { data: rows, error } = await db
    .from("watchlists")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .eq("type", "listing")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const listingIds = (rows ?? []).map((row) => row.listing_id as string);
  if (listingIds.length === 0) return [];

  const { data: listings, error: listingsError } = await db.from("listings").select("*").in("id", listingIds);
  if (listingsError) throw listingsError;

  const listingMap = new Map((listings ?? []).map((l) => [l.id, l as Listing]));
  return listingIds.map((id) => listingMap.get(id)).filter((l): l is Listing => !!l);
}

/**
 * Insert, tolerating the "already saved" case idempotently. Not a real upsert
 * because watchlists_listing_unique is a partial index (`where type =
 * 'listing'`) — supabase-js's onConflict target can't express that predicate,
 * so a plain insert + duplicate-key swallow is simpler than fighting it.
 */
export async function addToWatchlist(userId: string, listingId: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("watchlists").insert({ user_id: userId, type: "listing", listing_id: listingId });
  if (error && error.code !== "23505") throw error;
}

export async function removeFromWatchlist(userId: string, listingId: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db
    .from("watchlists")
    .delete()
    .eq("user_id", userId)
    .eq("type", "listing")
    .eq("listing_id", listingId);
  if (error) throw error;
}
