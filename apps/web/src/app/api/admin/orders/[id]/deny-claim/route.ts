import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { denyDoaClaim } from "@/lib/server/orders";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const order = await denyDoaClaim(id);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
