import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getAdminAnalytics } from "@/lib/server/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const analytics = await getAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    return handleRouteError(error);
  }
}
