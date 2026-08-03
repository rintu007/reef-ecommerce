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
