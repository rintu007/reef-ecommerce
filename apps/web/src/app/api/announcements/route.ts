import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getActiveAnnouncement } from "@/lib/server/announcements";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const announcement = await getActiveAnnouncement(user);
    return NextResponse.json({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}
