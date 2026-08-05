import { NextResponse } from "next/server";
import { blockedUserCreateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { blockUser, listBlockedUsers } from "@/lib/server/moderation";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const blockedUsers = await listBlockedUsers(user.id);
    return NextResponse.json({ blockedUsers });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = blockedUserCreateSchema.parse(await request.json());
    const blockedUser = await blockUser(user.id, input);
    return NextResponse.json({ blockedUser }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
