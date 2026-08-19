import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { denyDoaClaim } from "@/lib/server/orders";
import { logAdminAction } from "@/lib/server/admin-log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const order = await denyDoaClaim(id);
    await logAdminAction(admin.id, "deny_doa_claim", "order", id);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
