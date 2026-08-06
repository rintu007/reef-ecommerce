import { NextResponse } from "next/server";
import { cartCheckoutInputSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { checkoutCart } from "@/lib/server/orders";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { items } = cartCheckoutInputSchema.parse(await request.json());
    const results = await checkoutCart(user.id, items);
    return NextResponse.json({ results });
  } catch (error) {
    return handleRouteError(error);
  }
}
