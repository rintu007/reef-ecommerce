import { NextResponse } from "next/server";
import { z } from "zod";
import { reportStatusSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { updateReportStatus } from "@/lib/server/admin";

const bodySchema = z.object({ status: reportStatusSchema });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const { status } = bodySchema.parse(await request.json());
    const report = await updateReportStatus(id, status);
    return NextResponse.json({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
