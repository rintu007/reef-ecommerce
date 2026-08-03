import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { handleRouteError } from "@/lib/server/http";
import { releaseStalePendingPickups } from "@/lib/server/orders";

/**
 * Vercel Cron (see vercel.json) hits this with the standard Bearer auth
 * header. SYSTEM_ANALYSIS.md SS3.5 describes the legacy job as ~hourly, but
 * this project is on Vercel's Hobby plan, which caps cron jobs at once/day —
 * scheduled for 4am UTC daily instead. The 72h threshold in
 * releaseStalePendingPickups() comfortably absorbs the coarser cadence.
 */
export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const released = await releaseStalePendingPickups();
    return NextResponse.json({ released });
  } catch (error) {
    return handleRouteError(error);
  }
}
