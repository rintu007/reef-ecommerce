import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminStats } from "@/lib/server/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}
