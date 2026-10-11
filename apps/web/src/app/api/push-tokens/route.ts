import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { registerPushToken } from "@/lib/server/push";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { token } = bodySchema.parse(await request.json());
    await registerPushToken(user.id, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
