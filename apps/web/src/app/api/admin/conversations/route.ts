import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getConversationForAdmin } from "@/lib/server/messages";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const userA = searchParams.get("user_a");
    const userB = searchParams.get("user_b");
    if (!userA || !userB) return apiError("user_a and user_b are required", 400);

    const result = await getConversationForAdmin(userA, userB);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
