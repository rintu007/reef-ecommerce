import { NextResponse } from "next/server";
import { z } from "zod";
import { userRoleSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { updateUserRole } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";

const bodySchema = z.object({ role: userRoleSchema });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { role } = bodySchema.parse(await request.json());

    if (id === admin.id && role !== "admin") {
      return apiError("Cannot remove your own admin role", 400);
    }

    const profile = await updateUserRole(id, role);
    await logAdminAction(admin.id, "update_user_role", "user", id, { role });
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
