import { NextResponse } from "next/server";
import { z } from "zod";
import { userRoleSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { updateUserRole } from "@/lib/server/admin";
import { deleteOwnAccount } from "@/lib/server/profiles";

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
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
