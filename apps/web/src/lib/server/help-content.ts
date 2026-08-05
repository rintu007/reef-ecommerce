import type { HelpContent } from "@reef-market/shared";
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
