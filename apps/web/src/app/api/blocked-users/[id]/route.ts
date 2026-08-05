import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { unblockUser } from "@/lib/server/moderation";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    await unblockUser(user.id, id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
