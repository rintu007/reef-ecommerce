import { NextResponse } from "next/server";
import { promoCodeUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deletePromoCode, updatePromoCode } from "@/lib/server/promo-codes";
import { logAdminAction } from "@/lib/server/admin-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const input = promoCodeUpdateSchema.parse(await request.json());
    const promoCode = await updatePromoCode(id, input);
    await logAdminAction(admin.id, "update_promo_code", "promo_code", id, input);
    return NextResponse.json({ promoCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    await deletePromoCode(id);
    await logAdminAction(admin.id, "delete_promo_code", "promo_code", id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
