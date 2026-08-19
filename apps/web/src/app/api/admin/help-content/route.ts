import { NextResponse } from "next/server";
import { helpContentCreateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createHelpContent, listAdminHelpContent } from "@/lib/server/help-content";
import { logAdminAction } from "@/lib/server/admin-log";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { items, total } = await listAdminHelpContent({
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ items, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const input = helpContentCreateSchema.parse(await request.json());
    const item = await createHelpContent(input);
    await logAdminAction(admin.id, "create_help_content", "help_content", item.id, { title: input.title });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
