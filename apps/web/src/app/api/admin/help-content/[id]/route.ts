import { NextResponse } from "next/server";
import { helpContentUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deleteHelpContent, updateHelpContent } from "@/lib/server/help-content";
import { logAdminAction } from "@/lib/server/admin-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const input = helpContentUpdateSchema.parse(await request.json());
    const item = await updateHelpContent(id, input);
    await logAdminAction(admin.id, "update_help_content", "help_content", id, input);
    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    await deleteHelpContent(id);
    await logAdminAction(admin.id, "delete_help_content", "help_content", id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
