import { NextResponse } from "next/server";
import type { DoaClaimReviewStatus } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listDoaClaims } from "@/lib/server/orders";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { claims, total } = await listDoaClaims({
      status: (searchParams.get("status") as DoaClaimReviewStatus) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ claims, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
