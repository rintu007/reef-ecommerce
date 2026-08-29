import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { unblockUser } from "@/lib/server/moderation";
import { logAdminAction } from "@/lib/server/admin-log";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

/** [id] is the blocked_users row id here, not a user id — needs a lookup to get the (blocker_id, blocked_id) pair unblockUser() actually deletes by. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const db = supabaseAdmin();
    const { data: row, error: fetchError } = await db.from("blocked_users").select("blocker_id, blocked_id").eq("id", id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!row) return apiError("Block not found", 404);

    await unblockUser(row.blocker_id, row.blocked_id);
    await logAdminAction(admin.id, "unblock_user", "blocked_user", id, { blocker_id: row.blocker_id, blocked_id: row.blocked_id });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
