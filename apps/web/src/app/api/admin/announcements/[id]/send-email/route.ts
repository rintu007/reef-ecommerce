import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { sendAnnouncementEmail } from "@/lib/server/announcements";
import { logAdminAction } from "@/lib/server/admin-log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const result = await sendAnnouncementEmail(id);
    await logAdminAction(admin.id, "send_announcement_email", "announcement", id, result);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
