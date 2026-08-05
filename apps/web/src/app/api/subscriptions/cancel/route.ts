import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { cancelOwnSubscription } from "@/lib/server/subscriptions";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const subscription = await cancelOwnSubscription(user.id);
    return NextResponse.json({ subscription });
  } catch (error) {
    return handleRouteError(error);
  }
}
