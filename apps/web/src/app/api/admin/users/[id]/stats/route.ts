import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getUserActivityStats } from "@/lib/server/admin";

/** Legacy parity: reef-trade-flow's per-user activity stats panel (purchases/sales/listings/last active). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const stats = await getUserActivityStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}
