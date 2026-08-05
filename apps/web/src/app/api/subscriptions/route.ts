import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getOwnSubscription } from "@/lib/server/subscriptions";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const result = await getOwnSubscription(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
