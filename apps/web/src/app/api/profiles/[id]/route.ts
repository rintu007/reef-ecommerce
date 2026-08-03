import { NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getPublicProfile } from "@/lib/server/profiles";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const profile = await getPublicProfile(id);
    if (!profile) return apiError("Profile not found", 404);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
