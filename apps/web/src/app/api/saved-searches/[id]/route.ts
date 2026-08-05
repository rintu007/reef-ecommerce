import { NextResponse } from "next/server";
import { savedSearchUpdateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { deleteSavedSearch, updateSavedSearch } from "@/lib/server/saved-searches";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const input = savedSearchUpdateSchema.parse(await request.json());
    const savedSearch = await updateSavedSearch(user.id, id, input);
    return NextResponse.json({ savedSearch });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    await deleteSavedSearch(user.id, id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
