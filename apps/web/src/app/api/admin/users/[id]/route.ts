import { NextResponse } from "next/server";
import { z } from "zod";
import { userRoleSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { updateAdminPermissions, updateUserRole } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";

const bodySchema = z.object({
  role: userRoleSchema.optional(),
  admin_permissions: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { role, admin_permissions } = bodySchema.parse(await request.json());

    if (id === admin.id && role && role !== "admin") {
      return apiError("Cannot remove your own admin role", 400);
    }

    let profile;
    if (role) {
      profile = await updateUserRole(id, role);
      await logAdminAction(admin.id, "update_user_role", "user", id, { role });
    }
    if (admin_permissions) {
      profile = await updateAdminPermissions(id, admin_permissions);
      await logAdminAction(admin.id, "update_admin_permissions", "user", id, { admin_permissions });
    }
    if (!profile) return apiError("Nothing to update", 400);

    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
