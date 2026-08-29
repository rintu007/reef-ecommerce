import type { AdminActionLogEntry } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Best-effort — a logging failure must never block the actual admin action
 * (a broken audit row shouldn't stop a real refund from going through).
 * Call this from every sensitive admin mutation, after the mutation itself
 * succeeds.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db
    .from("admin_action_log")
    .insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, details: details ?? null });
  if (error) console.error("Failed to log admin action", action, targetType, targetId, error);
}

export interface AdminActionLogListParams {
  adminId?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}

export async function listAdminActionLog(params: AdminActionLogListParams): Promise<{ entries: AdminActionLogEntry[]; total: number }> {
  const db = supabaseAdmin();
  let query = db.from("admin_action_log").select("*, profiles(email, display_name)", { count: "exact" });

  if (params.adminId) query = query.eq("admin_id", params.adminId);
  if (params.targetType) query = query.eq("target_type", params.targetType);

  const limit = Math.min(params.limit ?? 100, 500);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const entries = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      admin_id: row.admin_id,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      details: row.details,
      created_at: row.created_at,
      admin_email: profile?.email ?? null,
      admin_display_name: profile?.display_name ?? null,
    };
  });

  return { entries, total: count ?? entries.length };
}
