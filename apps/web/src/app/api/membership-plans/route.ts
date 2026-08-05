import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/server/http";
import { listMembershipPlans } from "@/lib/server/subscriptions";

export async function GET() {
  try {
    const plans = await listMembershipPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return handleRouteError(error);
  }
}
