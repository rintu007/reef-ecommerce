import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getPromoCodeRedemptions } from "@/lib/server/promo-codes";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const redemptions = await getPromoCodeRedemptions(id);
    return NextResponse.json({ redemptions });
  } catch (error) {
    return handleRouteError(error);
  }
}
