import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getOrderById } from "@/lib/server/orders";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const order = await getOrderById(id, user);
    if (!order) return apiError("Order not found", 404);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
