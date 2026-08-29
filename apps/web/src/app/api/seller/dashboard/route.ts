import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getSellerDashboardMetrics } from "@/lib/server/orders";

/** Legacy parity: reef-trade-flow's SellerDashboard.jsx metrics grid — self-scoped, whoever's authenticated. */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const metrics = await getSellerDashboardMetrics(user.id);
    return NextResponse.json(metrics);
  } catch (error) {
    return handleRouteError(error);
  }
}
