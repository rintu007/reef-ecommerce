import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { listOrdersForUser } from "@/lib/server/orders";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    if (role !== "buyer" && role !== "seller") return apiError("role must be 'buyer' or 'seller'", 400);

    const orders = await listOrdersForUser(user.id, role);
    return NextResponse.json({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
