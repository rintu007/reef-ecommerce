import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAllOrders } from "@/lib/server/orders";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 200);
    const orders = await listAllOrders(limit);
    return NextResponse.json({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
