import { NextResponse } from "next/server";
import { serviceCreateSchema } from "@reef-market/shared";
import { getAuthenticatedUser, requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { queryServices, type ServiceQueryParams } from "@/lib/server/services";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");

    const params: ServiceQueryParams = {
      providerId: searchParams.get("provider_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      market: market === "saltwater" || market === "freshwater" ? market : undefined,
      serviceType: searchParams.get("service_type") ?? undefined,
      limit: Number(searchParams.get("limit")) || undefined,
      offset: Number(searchParams.get("offset")) || undefined,
    };

    const { services, total } = await queryServices(params, user);
    return NextResponse.json({ services, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = serviceCreateSchema.parse(await request.json());

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("services")
      .insert({ ...input, provider_id: user.id, status: "active" })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
