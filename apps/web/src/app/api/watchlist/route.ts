import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { addToWatchlist, listSavedListings } from "@/lib/server/watchlist";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const listings = await listSavedListings(user.id);
    return NextResponse.json({ listings });
  } catch (error) {
    return handleRouteError(error);
  }
}

const bodySchema = z.object({ listing_id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { listing_id } = bodySchema.parse(await request.json());
    await addToWatchlist(user.id, listing_id);
    return NextResponse.json({ saved: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
