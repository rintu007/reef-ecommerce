import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/server/http";
import { listReviewsForSeller } from "@/lib/server/reviews";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const summary = await listReviewsForSeller(id);
    return NextResponse.json(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
