import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminVisitorLogs } from "@/lib/server/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { logs, total } = await listAdminVisitorLogs({
      sessionId: searchParams.get("session_id") || undefined,
      userEmail: searchParams.get("user_email") || undefined,
      guestsOnly: searchParams.get("guests_only") === "true",
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ logs, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
