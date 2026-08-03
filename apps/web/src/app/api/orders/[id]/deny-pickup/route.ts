import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { denyPickup } from "@/lib/server/orders";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const order = await denyPickup(id, user.id);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
