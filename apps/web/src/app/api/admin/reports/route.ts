import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { listAdminReports } from "@/lib/server/admin";
import type { ReportStatus } from "@reef-market/shared";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const { reports, total } = await listAdminReports({
      status: (searchParams.get("status") as ReportStatus) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    });
    return NextResponse.json({ reports, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
