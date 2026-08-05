import type { SavedSearch, SavedSearchCreateInput, SavedSearchUpdateInput } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

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
