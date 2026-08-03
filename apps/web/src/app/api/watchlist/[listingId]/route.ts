import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { removeFromWatchlist } from "@/lib/server/watchlist";

export async function DELETE(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const user = await requireUser(request);
    const { listingId } = await params;
    await removeFromWatchlist(user.id, listingId);
    return NextResponse.json({ saved: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
