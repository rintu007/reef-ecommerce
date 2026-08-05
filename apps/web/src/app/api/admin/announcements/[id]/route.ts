import { NextResponse } from "next/server";
import { announcementUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/server/announcements";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const input = announcementUpdateSchema.parse(await request.json());
    const announcement = await updateAnnouncement(id, input);
    return NextResponse.json({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deleteAnnouncement(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
