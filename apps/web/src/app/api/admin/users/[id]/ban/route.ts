import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { banUser, unbanUser } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";

const bodySchema = z.object({ ban: z.boolean() });

/** Legacy parity: reef-trade-flow's admin "Block User" / "Unblock" action. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { ban } = bodySchema.parse(await request.json());

    if (id === admin.id) return apiError("Cannot ban your own account", 400);

    const profile = ban ? await banUser(id) : await unbanUser(id);
    await logAdminAction(admin.id, ban ? "ban_user" : "unban_user", "user", id);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
