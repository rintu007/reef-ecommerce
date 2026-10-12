import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listNotifications } from "@/lib/server/notifications";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await listNotifications(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
