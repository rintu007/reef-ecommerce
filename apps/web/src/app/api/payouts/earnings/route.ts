import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getSellerEarningsSummary } from "@/lib/server/payouts";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const summary = await getSellerEarningsSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
