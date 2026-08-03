import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createOnboardingLink } from "@/lib/server/payouts";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const url = await createOnboardingLink(user.id, user.email);
    return NextResponse.json({ url });
  } catch (error) {
    return handleRouteError(error);
  }
}
