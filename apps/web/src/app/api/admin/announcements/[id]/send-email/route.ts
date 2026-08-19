import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { sendAnnouncementEmail } from "@/lib/server/announcements";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const result = await sendAnnouncementEmail(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
