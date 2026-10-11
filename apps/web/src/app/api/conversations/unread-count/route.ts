import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { getUnreadMessageCount } from "@/lib/server/messages";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const count = await getUnreadMessageCount(user.id);
    return NextResponse.json({ count });
  } catch (error) {
    return handleRouteError(error);
  }
}
