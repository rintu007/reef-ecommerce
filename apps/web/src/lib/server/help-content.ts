import type { HelpContent, HelpContentCreateInput, HelpContentUpdateInput } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

export interface HelpContentQueryParams {
  category?: string;
  market?: "saltwater" | "freshwater";
}

/** Public content only — there's no admin-preview path yet, unlike listings/services. */
export async function queryHelpContent(params: HelpContentQueryParams): Promise<HelpContent[]> {
  const db = supabaseAdmin();
  let query = db.from("help_content").select("*").eq("published", true);

  if (params.category) query = query.eq("category", params.category);
  if (params.market) query = query.in("market", [params.market, "both"]);

  query = query.order("display_order", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as HelpContent[];
}

export async function listAdminHelpContent(params: { limit?: number; offset?: number } = {}): Promise<{ items: HelpContent[]; total: number }> {
  const db = supabaseAdmin();
  const limit = Math.min(params.limit ?? 100, 200);
  const offset = Math.max(params.offset ?? 0, 0);

  const { data, error, count } = await db
    .from("help_content")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { items: (data ?? []) as HelpContent[], total: count ?? data?.length ?? 0 };
}

export async function createHelpContent(input: HelpContentCreateInput): Promise<HelpContent> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("help_content").insert(input).select().single();
  if (error) throw error;
  return data as HelpContent;
}

export async function updateHelpContent(id: string, input: HelpContentUpdateInput): Promise<HelpContent> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("help_content").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as HelpContent;
}

export async function deleteHelpContent(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("help_content").delete().eq("id", id);
  if (error) throw error;
}
