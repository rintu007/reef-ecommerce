import { NextResponse } from "next/server";
import { serviceUpdateSchema } from "@reef-market/shared";
import { getAuthenticatedUser, requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getServiceById } from "@/lib/server/services";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    const service = await getServiceById(id, user);
    if (!service) return apiError("Service not found", 404);
    return NextResponse.json({ service });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireUser(request);
    const input = serviceUpdateSchema.parse(await request.json());

    const db = supabaseAdmin();
    const { data: existing, error: fetchError } = await db
      .from("services")
      .select("provider_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return apiError("Service not found", 404);
    if (existing.provider_id !== user.id && user.role !== "admin") return apiError("Forbidden", 403);

    const { data, error } = await db.from("services").update(input).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ service: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireUser(request);

    const db = supabaseAdmin();
    const { data: existing, error: fetchError } = await db
      .from("services")
      .select("provider_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return apiError("Service not found", 404);
    if (existing.provider_id !== user.id && user.role !== "admin") return apiError("Forbidden", 403);

    const { error } = await db.from("services").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
