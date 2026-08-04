import type { Service } from "@reef-market/shared";
import type { AuthUser } from "./auth";
import { supabaseAdmin } from "./supabase-admin";

export interface ServiceQueryParams {
  providerId?: string;
  status?: string;
  market?: "saltwater" | "freshwater";
  serviceType?: string;
  limit?: number;
  offset?: number;
}

/** Mirrors queryListings' market-merge rule (SYSTEM_ANALYSIS.md SS3.2) for consistency. */
export async function queryServices(
  params: ServiceQueryParams,
  viewer: AuthUser | null
): Promise<{ services: Service[]; total: number }> {
  const isOwnerOrAdmin = !!viewer && (viewer.role === "admin" || viewer.id === params.providerId);

  const db = supabaseAdmin();
  let query = db.from("services").select("*", { count: "exact" });

  if (params.providerId) query = query.eq("provider_id", params.providerId);

  if (isOwnerOrAdmin) {
    if (params.status) query = query.eq("status", params.status);
  } else {
    query = query.eq("status", "active");
  }

  if (params.market) query = query.in("market", [params.market, "both"]);
  if (params.serviceType) query = query.eq("service_type", params.serviceType);

  query = query.order("created_at", { ascending: false });

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { services: (data ?? []) as Service[], total: count ?? data?.length ?? 0 };
}

export async function getServiceById(id: string, viewer: AuthUser | null): Promise<Service | null> {
  const db = supabaseAdmin();
  const { data: service, error } = await db.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!service) return null;

  const isOwnerOrAdmin = !!viewer && (viewer.id === service.provider_id || viewer.role === "admin");
  if (service.status !== "active" && !isOwnerOrAdmin) return null;

  return service as Service;
}
