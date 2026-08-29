import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminUserDetail } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";

/** Read-only ("view as user" support tool) — no mutation happens here, but viewing someone else's full account picture (orders, reviews, reports about them) is sensitive enough to leave a trail of who looked and when. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const detail = await getAdminUserDetail(id, admin);
    if (id !== admin.id) await logAdminAction(admin.id, "view_user_detail", "user", id);
    return NextResponse.json(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}
