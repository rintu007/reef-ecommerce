import { NextResponse } from "next/server";
import { promoCodeUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deletePromoCode, updatePromoCode } from "@/lib/server/promo-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const input = promoCodeUpdateSchema.parse(await request.json());
    const promoCode = await updatePromoCode(id, input);
    return NextResponse.json({ promoCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deletePromoCode(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
