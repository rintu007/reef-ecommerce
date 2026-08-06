import type { Profile, ProfileUpdateInput, PublicProfile } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

export async function getOwnProfile(userId: string): Promise<Profile> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateOwnProfile(userId: string, input: ProfileUpdateInput): Promise<Profile> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("profiles").update(input).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

/** One-way consent flips — no request body accepted, mirrors legacy's `updateMe({ seller_agreed: true })`/`{ eula_accepted: true }`. */
export async function agreeSellerTerms(userId: string): Promise<Profile> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("profiles").update({ seller_agreed: true }).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function acceptEula(userId: string): Promise<Profile> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("profiles").update({ eula_accepted: true }).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

/**
 * orders.buyer_id/seller_id are ON DELETE RESTRICT (unlike everything else,
 * which cascades) — a hard delete would fail outright for anyone with order
 * history, so those accounts are anonymized + banned instead of removed.
 */
export async function deleteOwnAccount(userId: string): Promise<{ anonymized: boolean }> {
  const db = supabaseAdmin();

  const { count, error: ordersError } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  if (ordersError) throw ordersError;

  if (!count) {
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { anonymized: false };
  }

  const { error: profileError } = await db
    .from("profiles")
    .update({
      email: `deleted-${userId}@reefmarket.invalid`,
      display_name: "Deleted User",
      avatar_url: null,
      bio: null,
      location: null,
      country: null,
      tank_photos: [],
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  await db.from("listings").update({ status: "removed" }).eq("seller_id", userId);
  await db.from("services").update({ status: "removed" }).eq("provider_id", userId);

  const { error: banError } = await db.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (banError) throw banError;

  return { anonymized: true };
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, avatar_url, tank_photos, bio, location, language, country, verified_seller, completed_sales_count, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}
