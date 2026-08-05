import { NextResponse } from "next/server";
import { profileUpdateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deleteOwnAccount, getOwnProfile, updateOwnProfile } from "@/lib/server/profiles";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const profile = await getOwnProfile(user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const input = profileUpdateSchema.parse(body);
    const profile = await updateOwnProfile(user.id, input);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const result = await deleteOwnAccount(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
