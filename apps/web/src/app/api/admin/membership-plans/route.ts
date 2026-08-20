import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAllMembershipPlans } from "@/lib/server/subscriptions";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const plans = await listAllMembershipPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return handleRouteError(error);
  }
}
