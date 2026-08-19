import { NextResponse } from "next/server";
import { z } from "zod";
import { reportStatusSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { updateReportStatus } from "@/lib/server/admin";
import { logAdminAction } from "@/lib/server/admin-log";

const bodySchema = z.object({ status: reportStatusSchema });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const { status } = bodySchema.parse(await request.json());
    const report = await updateReportStatus(id, status);
    await logAdminAction(admin.id, "update_report_status", "report", id, { status });
    return NextResponse.json({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
