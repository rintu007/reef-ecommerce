import type { BlockedUser, BlockedUserCreateInput, Report, ReportCreateInput } from "@reef-market/shared";
import { AppError } from "./http";
import { supabaseAdmin } from "./supabase-admin";

export async function createReport(reporterId: string, input: ReportCreateInput): Promise<Report> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("reports")
    .insert({ ...input, reporter_id: reporterId, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as Report;
}

export async function listBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("blocked_users")
    .select("*")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlockedUser[];
}

export async function blockUser(blockerId: string, input: BlockedUserCreateInput): Promise<BlockedUser> {
  if (input.blocked_id === blockerId) throw new AppError("Cannot block yourself");
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("blocked_users")
    .insert({ ...input, blocker_id: blockerId })
    .select()
    .single();
  if (error && error.code !== "23505") throw error;
  if (data) return data as BlockedUser;

  const { data: existing, error: existingError } = await db
    .from("blocked_users")
    .select("*")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", input.blocked_id)
    .single();
  if (existingError) throw existingError;
  return existing as BlockedUser;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  if (error) throw error;
}

export interface AdminBlockedUser extends BlockedUser {
  blocker: { id: string; display_name: string | null; email: string } | null;
  blocked: { id: string; display_name: string | null; email: string } | null;
}

export interface AdminBlockedUserListParams {
  /** Blocks involving this one user, on either side (blocker or blocked). */
  userId?: string;
  limit?: number;
  offset?: number;
}

/** No admin visibility existed into who has blocked whom — useful the moment a dispute involves two users who've blocked each other. */
export async function listAllBlockedUsers(params: AdminBlockedUserListParams = {}): Promise<{ blockedUsers: AdminBlockedUser[]; total: number }> {
  const db = supabaseAdmin();
  const limit = Math.min(params.limit ?? 100, 500);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = db.from("blocked_users").select("*", { count: "exact" });
  if (params.userId) query = query.or(`blocker_id.eq.${params.userId},blocked_id.eq.${params.userId}`);

  const { data: rows, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  if (!rows || rows.length === 0) return { blockedUsers: [], total: count ?? 0 };

  const profileIds = [...new Set(rows.flatMap((r) => [r.blocker_id, r.blocked_id]))];
  const { data: profiles } = await db.from("profiles").select("id, display_name, email").in("id", profileIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    blockedUsers: rows.map((r) => ({
      ...(r as BlockedUser),
      blocker: profileMap.get(r.blocker_id) ?? null,
      blocked: profileMap.get(r.blocked_id) ?? null,
    })),
    total: count ?? rows.length,
  };
}
