import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminActionLog } from "@/lib/server/admin-log";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { entries, total } = await listAdminActionLog({
      adminId: searchParams.get("admin_id") || undefined,
      targetType: searchParams.get("target_type") || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ entries, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
