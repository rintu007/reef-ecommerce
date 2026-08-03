import type { Profile, Report, ReportStatus, UserRole } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

export interface AdminStats {
  listings: { total: number; active: number; pending_approval: number; sold: number; removed: number };
  users: { total: number };
  reports: { pending: number };
  orders: { total: number; completed: number; doa_claim: number };
  visitors: { total: number; last7Days: number; last30Days: number };
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = supabaseAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: listingsTotal },
    { count: listingsActive },
    { count: listingsPending },
    { count: listingsSold },
    { count: listingsRemoved },
    { count: usersTotal },
    { count: reportsPending },
    { count: ordersTotal },
    { count: ordersCompleted },
    { count: ordersDoaClaim },
    { count: visitorsTotal },
    { count: visitors7d },
    { count: visitors30d },
  ] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "removed"),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "doa_claim"),
    db.from("visitor_logs").select("id", { count: "exact", head: true }),
    db.from("visitor_logs").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    db.from("visitor_logs").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
  ]);

  return {
    listings: {
      total: listingsTotal ?? 0,
      active: listingsActive ?? 0,
      pending_approval: listingsPending ?? 0,
      sold: listingsSold ?? 0,
      removed: listingsRemoved ?? 0,
    },
    users: { total: usersTotal ?? 0 },
    reports: { pending: reportsPending ?? 0 },
    orders: { total: ordersTotal ?? 0, completed: ordersCompleted ?? 0, doa_claim: ordersDoaClaim ?? 0 },
    visitors: { total: visitorsTotal ?? 0, last7Days: visitors7d ?? 0, last30Days: visitors30d ?? 0 },
  };
}

export interface AdminUserListParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listAdminUsers(params: AdminUserListParams): Promise<{ users: Profile[]; total: number }> {
  const db = supabaseAdmin();
  let query = db.from("profiles").select("*", { count: "exact" });

  if (params.q) {
    const term = params.q.replace(/[%_]/g, "\\$&");
    query = query.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
  }

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { users: (data ?? []) as Profile[], total: count ?? data?.length ?? 0 };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<Profile> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("profiles").update({ role }).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export interface AdminReport extends Report {
  reporter: { id: string; display_name: string | null; email: string } | null;
  reported: { id: string; display_name: string | null; email: string } | null;
  listing: { id: string; title: string } | null;
}

export interface AdminReportListParams {
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

export async function listAdminReports(params: AdminReportListParams): Promise<{ reports: AdminReport[]; total: number }> {
  const db = supabaseAdmin();
  let query = db.from("reports").select("*", { count: "exact" });
  if (params.status) query = query.eq("status", params.status);

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: reports, error, count } = await query;
  if (error) throw error;
  if (!reports || reports.length === 0) return { reports: [], total: count ?? 0 };

  const profileIds = [...new Set(reports.flatMap((r) => [r.reporter_id, r.reported_id]).filter(Boolean))] as string[];
  const listingIds = [...new Set(reports.map((r) => r.listing_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    profileIds.length
      ? db.from("profiles").select("id, display_name, email").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null; email: string }[] }),
    listingIds.length
      ? db.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));

  return {
    reports: reports.map((r) => ({
      ...(r as Report),
      reporter: profileMap.get(r.reporter_id) ?? null,
      reported: r.reported_id ? profileMap.get(r.reported_id) ?? null : null,
      listing: r.listing_id ? listingMap.get(r.listing_id) ?? null : null,
    })),
    total: count ?? reports.length,
  };
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<Report> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("reports").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data as Report;
}
