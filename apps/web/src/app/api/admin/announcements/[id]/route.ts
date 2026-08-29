import { NextResponse } from "next/server";
import { announcementUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/server/announcements";
import { logAdminAction } from "@/lib/server/admin-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const input = announcementUpdateSchema.parse(await request.json());
    const announcement = await updateAnnouncement(id, input);
    await logAdminAction(admin.id, "update_announcement", "announcement", id, input);
    return NextResponse.json({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    await deleteAnnouncement(id);
    await logAdminAction(admin.id, "delete_announcement", "announcement", id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
