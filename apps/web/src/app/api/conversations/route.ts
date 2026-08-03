import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listConversations } from "@/lib/server/messages";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const conversations = await listConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    return handleRouteError(error);
  }
}
