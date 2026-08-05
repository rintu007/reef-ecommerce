import { NextResponse } from "next/server";
import { savedSearchCreateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createSavedSearch, listSavedSearches } from "@/lib/server/saved-searches";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const savedSearches = await listSavedSearches(user.id);
    return NextResponse.json({ savedSearches });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = savedSearchCreateSchema.parse(await request.json());
    const savedSearch = await createSavedSearch(user.id, input);
    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
