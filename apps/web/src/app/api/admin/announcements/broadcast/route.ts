import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { broadcastAnnouncement } from "@/lib/server/announcements";

const bodySchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  sendEmail: z.boolean(),
  sendPopup: z.boolean(),
  maxViews: z.number().int().nonnegative(),
  showToGuests: z.boolean(),
});

/** Legacy parity: reef-trade-flow's admin "Broadcast Announcement" (sendBroadcastMessage). */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const input = bodySchema.parse(await request.json());
    const result = await broadcastAnnouncement(input);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
