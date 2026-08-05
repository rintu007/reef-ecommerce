import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/server/http";
import { queryHelpContent } from "@/lib/server/help-content";

/** Public Learn/help library feed — no auth required, guests included. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");

    const items = await queryHelpContent({
      category: searchParams.get("category") ?? undefined,
      market: market === "saltwater" || market === "freshwater" ? market : undefined,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
