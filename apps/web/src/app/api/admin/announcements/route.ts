import { NextResponse } from "next/server";
import { announcementCreateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createAnnouncement, listAdminAnnouncements } from "@/lib/server/announcements";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { announcements, total } = await listAdminAnnouncements({
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ announcements, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const input = announcementCreateSchema.parse(await request.json());
    const announcement = await createAnnouncement(input);
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
