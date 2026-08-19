import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { refundOrder } from "@/lib/server/orders";
import { logAdminAction } from "@/lib/server/admin-log";

const bodySchema = z.object({ mode: z.enum(["refund", "store_credit"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminPermission(request, "manage_finances");
    const { id } = await params;
    const { mode } = bodySchema.parse(await request.json());
    const order = await refundOrder(id, admin.id, mode);
    await logAdminAction(admin.id, "refund_order", "order", id, { mode });
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
