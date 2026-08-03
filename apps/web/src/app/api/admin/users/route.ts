import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminUsers } from "@/lib/server/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { users, total } = await listAdminUsers({
      q: searchParams.get("q") ?? undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ users, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
