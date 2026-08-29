import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { logAdminAction } from "@/lib/server/admin-log";
import { redeemPromoCode } from "@/lib/server/promo-codes";

const bodySchema = z.object({ code: z.string().min(1) });

/** Legacy parity: reef-trade-flow's admin "Apply Promo Code" to a specific user — reuses the same redemption logic a user applying their own code goes through. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { code } = bodySchema.parse(await request.json());
    const result = await redeemPromoCode(id, code);
    await logAdminAction(admin.id, "grant_promo_code", "user", id, { code });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
