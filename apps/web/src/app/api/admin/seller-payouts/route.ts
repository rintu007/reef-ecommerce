import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listSellerPayoutAccounts } from "@/lib/server/payouts";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const accounts = await listSellerPayoutAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleRouteError(error);
  }
}
