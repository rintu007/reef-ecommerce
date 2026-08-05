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
