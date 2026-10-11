import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createOnboardingLink } from "@/lib/server/payouts";

const bodySchema = z.object({
  return_url: z.string().url().optional(),
  refresh_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    // Body is optional — web callers send nothing and get the default
    // web return URLs; mobile sends its reefmarket:// deep link.
    const raw = await request.text();
    const { return_url, refresh_url } = bodySchema.parse(raw ? JSON.parse(raw) : {});
    const url = await createOnboardingLink(user.id, user.email, return_url, refresh_url);
    return NextResponse.json({ url });
  } catch (error) {
    return handleRouteError(error);
  }
}
