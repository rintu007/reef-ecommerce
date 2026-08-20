import { NextResponse } from "next/server";
import { membershipPlanUpdateSchema } from "@reef-market/shared";
import { requireAdmin } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { updateMembershipPlan } from "@/lib/server/subscriptions";
import { logAdminAction } from "@/lib/server/admin-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const input = membershipPlanUpdateSchema.parse(await request.json());
    const plan = await updateMembershipPlan(id, input);
    await logAdminAction(admin.id, "update_membership_plan", "membership_plan", id, input);
    return NextResponse.json({ plan });
  } catch (error) {
    return handleRouteError(error);
  }
}
