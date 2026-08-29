import type { Listing, SavedSearch, SavedSearchCreateInput, SavedSearchUpdateInput } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";
import { sendSavedSearchMatchEmail } from "./email";

export async function listSavedSearches(userId: string): Promise<SavedSearch[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export async function createSavedSearch(userId: string, input: SavedSearchCreateInput): Promise<SavedSearch> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("saved_searches")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function updateSavedSearch(userId: string, id: string, input: SavedSearchUpdateInput): Promise<SavedSearch> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("saved_searches")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function deleteSavedSearch(userId: string, id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("saved_searches").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

function matchesSavedSearch(listing: Listing, search: SavedSearch): boolean {
  if (search.listing_type && listing.listing_type !== search.listing_type) return false;
  if (search.category && listing.category !== search.category) return false;
  if (search.max_price != null && listing.price > search.max_price) return false;
  if (search.shipping_available && !listing.shipping_available) return false;
  if (search.local_pickup && !listing.local_pickup) return false;
  if (search.keyword) {
    const kw = search.keyword.toLowerCase();
    const haystack = [listing.title, listing.description, listing.species_name, listing.category].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  return true;
}

/**
 * Legacy parity: reef-trade-flow's `notifyMatchingSavedSearches` automation,
 * triggered whenever a new listing went active. Saved-search CRUD existed in
 * this app already, but nothing matched new listings against them or
 * notified anyone — saved searches silently did nothing. Called
 * fire-and-forget from listing creation (see api/listings/route.ts) — a
 * failure here must never break listing creation itself.
 */
export async function notifyMatchingSavedSearches(listing: Listing): Promise<void> {
  if (listing.status !== "active") return;

  const db = supabaseAdmin();
  const { data: searches, error } = await db.from("saved_searches").select("*").eq("is_active", true);
  if (error) throw error;
  if (!searches || searches.length === 0) return;

  const matched = (searches as SavedSearch[]).filter((s) => matchesSavedSearch(listing, s));
  if (matched.length === 0) return;

  // De-duplicate by user — one email per user even if multiple of their searches matched.
  const byUser = new Map<string, string[]>();
  for (const s of matched) {
    const names = byUser.get(s.user_id) ?? [];
    names.push(s.name || "Saved Search");
    byUser.set(s.user_id, names);
  }

  const { data: profiles, error: profilesError } = await db.from("profiles").select("id, email").in("id", [...byUser.keys()]);
  if (profilesError) throw profilesError;

  await Promise.all((profiles ?? []).map((p) => sendSavedSearchMatchEmail(p.email, listing, byUser.get(p.id) ?? [])));
}
