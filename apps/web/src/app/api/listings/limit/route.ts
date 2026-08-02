import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getListingLimitStatus } from "@/lib/server/listings";

/** Preflight check for the Sell flow — replaces base44/functions/checkListingLimit. */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const status = await getListingLimitStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
