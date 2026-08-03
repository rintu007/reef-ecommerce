import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { refundOrder } from "@/lib/server/orders";

const bodySchema = z.object({ mode: z.enum(["refund", "store_credit"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { mode } = bodySchema.parse(await request.json());
    const order = await refundOrder(id, admin.id, mode);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
