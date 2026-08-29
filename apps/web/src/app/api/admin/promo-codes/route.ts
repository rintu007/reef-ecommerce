import { NextResponse } from "next/server";
import { promoCodeCreateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createPromoCode, listAdminPromoCodes } from "@/lib/server/promo-codes";
import { logAdminAction } from "@/lib/server/admin-log";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { promoCodes, total } = await listAdminPromoCodes({
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ promoCodes, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const input = promoCodeCreateSchema.parse(await request.json());
    const promoCode = await createPromoCode(input);
    await logAdminAction(admin.id, "create_promo_code", "promo_code", promoCode.id, { code: input.code, type: input.type });
    return NextResponse.json({ promoCode }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
