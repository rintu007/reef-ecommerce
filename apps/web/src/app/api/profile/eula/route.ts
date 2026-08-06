import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { acceptEula } from "@/lib/server/profiles";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const profile = await acceptEula(user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
