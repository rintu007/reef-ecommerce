import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAllBlockedUsers } from "@/lib/server/moderation";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { blockedUsers, total } = await listAllBlockedUsers({
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ blockedUsers, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
