import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getConversationMessages, markConversationRead } from "@/lib/server/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireUser(request);

    const thread = await getConversationMessages(id, user.id);
    if (thread === null) return apiError("Conversation not found", 404);

    await markConversationRead(id, user.id);

    return NextResponse.json(thread);
  } catch (error) {
    return handleRouteError(error);
  }
}
