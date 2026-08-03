import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getPayoutStatus } from "@/lib/server/payouts";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const status = await getPayoutStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
