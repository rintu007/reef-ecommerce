import { NextResponse } from "next/server";
import { checkoutInputSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createCheckoutIntent } from "@/lib/server/orders";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = checkoutInputSchema.parse(await request.json());
    const { order, clientSecret } = await createCheckoutIntent(user.id, input);
    return NextResponse.json({ order, clientSecret });
  } catch (error) {
    return handleRouteError(error);
  }
}
