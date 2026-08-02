import { NextResponse } from "next/server";
import { listingUpdateSchema } from "@reef-market/shared";
import { getAuthenticatedUser, requireUser } from "@/lib/server/auth";
import { apiError, handleRouteError } from "@/lib/server/http";
import { getListingById } from "@/lib/server/listings";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    const listing = await getListingById(id, user);
    if (!listing) return apiError("Listing not found", 404);

    return NextResponse.json({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireUser(request);
    const body = await request.json();
    const input = listingUpdateSchema.parse(body);

    const db = supabaseAdmin();
    const { data: existing, error: fetchError } = await db
      .from("listings")
      .select("seller_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return apiError("Listing not found", 404);
    if (existing.seller_id !== user.id && user.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    const { data, error } = await db.from("listings").update(input).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ listing: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Hard delete, matching base44/functions/deleteListing (not a soft-remove via status). */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireUser(request);

    const db = supabaseAdmin();
    const { data: existing, error: fetchError } = await db
      .from("listings")
      .select("seller_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return apiError("Listing not found", 404);
    if (existing.seller_id !== user.id && user.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    const { error } = await db.from("listings").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
