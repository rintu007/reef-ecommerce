import { NextResponse } from "next/server";
import { shipOrderInputSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { markShipped } from "@/lib/server/orders";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const input = shipOrderInputSchema.parse(await request.json());
    const order = await markShipped(id, user.id, input);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
