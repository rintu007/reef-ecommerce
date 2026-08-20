import { NextResponse } from "next/server";
import type { PlanSlug, SubscriptionStatus } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminSubscriptions } from "@/lib/server/subscriptions";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { subscriptions, total } = await listAdminSubscriptions({
      status: (searchParams.get("status") as SubscriptionStatus) || undefined,
      planSlug: (searchParams.get("plan_slug") as PlanSlug) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ subscriptions, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
