import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createSubscriptionCheckoutSession } from "@/lib/server/subscriptions";

const bodySchema = z.object({ plan_slug: z.enum(["pro", "business"]) });

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { plan_slug } = bodySchema.parse(await request.json());
    const url = await createSubscriptionCheckoutSession(user.id, user.email, plan_slug);
    return NextResponse.json({ url });
  } catch (error) {
    return handleRouteError(error);
  }
}
