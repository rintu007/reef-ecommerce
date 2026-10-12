import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { markAllNotificationsRead } from "@/lib/server/notifications";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
