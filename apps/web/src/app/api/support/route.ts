import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/server/http";
import { sendSupportMessage } from "@/lib/server/email";

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(["question", "feedback", "bug", "other"]),
  message: z.string().min(1),
});

/** Public — no auth required, matches legacy's Support page contact form (guests can reach support too). */
export async function POST(request: Request) {
  try {
    const input = bodySchema.parse(await request.json());
    await sendSupportMessage(input);
    return NextResponse.json({ sent: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
