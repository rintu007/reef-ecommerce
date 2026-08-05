import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { redeemPromoCode } from "@/lib/server/promo-codes";

const bodySchema = z.object({ code: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { code } = bodySchema.parse(await request.json());
    const result = await redeemPromoCode(user.id, code);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
