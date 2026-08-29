import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminReviews } from "@/lib/server/reviews";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { reviews, total } = await listAdminReviews({
      maxRating: Number(searchParams.get("max_rating")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ reviews, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
