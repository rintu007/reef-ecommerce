import { NextResponse } from "next/server";
import { reportCreateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createReport } from "@/lib/server/moderation";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = reportCreateSchema.parse(await request.json());
    const report = await createReport(user.id, input);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
