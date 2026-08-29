import { NextResponse } from "next/server";
import { z } from "zod";
import { userRoleSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { updateAdminPermissions, updateUserRole } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";
import { deleteOwnAccount } from "@/lib/server/profiles";

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

/**
 * Legacy parity: reef-trade-flow's admin "Delete Account" action. Reuses the
 * exact same anonymize-or-hard-delete logic as a user deleting their own
 * account (`deleteOwnAccount` isn't actually self-only at the function
 * level — the "own" in its name just describes how the self-service route
 * calls it) — orders reference buyer/seller with ON DELETE RESTRICT, so
 * accounts with order history get anonymized + banned rather than removed.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    if (id === admin.id) return apiError("Cannot delete your own account from here", 400);

    const result = await deleteOwnAccount(id);
    await logAdminAction(admin.id, "delete_user_account", "user", id, result);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
