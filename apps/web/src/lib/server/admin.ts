import type { AdminAnalytics, AdminStats, Profile, Report, ReportStatus, UserRole } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";

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

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const db = supabaseAdmin();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: listingsTotal },
    { count: listingsActive },
    { count: listingsSold },
    { count: listingsRemoved },
    { count: usersTotal },
    { count: ordersLast30Days },
    { count: listingsLast30Days },
    { count: usersLast30Days },
    { data: revenueRows },
    { data: reviewRows },
    { data: visitorRows },
    { data: visitsByDayRows },
    { data: topPagesRows },
  ] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("status", "removed"),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.from("listings").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.rpc("get_order_revenue_summary"),
    db.rpc("get_review_summary"),
    db.rpc("get_visitor_analytics"),
    db.rpc("get_visits_by_day", { days_back: 30 }),
    db.rpc("get_top_pages", { limit_count: 10 }),
  ]);

  const revenue = revenueRows?.[0];
  const review = reviewRows?.[0];
  const visitor = visitorRows?.[0];

  return {
    orders: {
      total: Number(revenue?.total_orders ?? 0),
      completed: Number(revenue?.completed_orders ?? 0),
      pending: Number(revenue?.pending_orders ?? 0),
      revenue: {
        total: Number(revenue?.revenue_completed ?? 0),
        avg: Number(revenue?.revenue_avg ?? 0),
        byStatus: {
          completed: Number(revenue?.revenue_completed ?? 0),
          pending: Number(revenue?.revenue_pending ?? 0),
          cancelled: Number(revenue?.revenue_cancelled ?? 0),
        },
      },
    },
    listings: {
      total: listingsTotal ?? 0,
      active: listingsActive ?? 0,
      sold: listingsSold ?? 0,
      removed: listingsRemoved ?? 0,
    },
    users: { total: usersTotal ?? 0 },
    reviews: { total: Number(review?.total ?? 0), avgRating: review?.total ? Number(review.avg_rating) : null },
    visitors: {
      total: Number(visitor?.total ?? 0),
      today: Number(visitor?.today ?? 0),
      last7Days: Number(visitor?.last_7_days ?? 0),
      last30Days: Number(visitor?.last_30_days ?? 0),
      uniqueSessions: Number(visitor?.unique_sessions ?? 0),
      authSessions: Number(visitor?.auth_sessions ?? 0),
      guestSessions: Number(visitor?.guest_sessions ?? 0),
      topPages: (topPagesRows ?? []).map((r: { path: string; count: number }) => ({ path: r.path, count: Number(r.count) })),
      visitsByDay: (visitsByDayRows ?? []).map((r: { day: string; count: number }) => ({ date: r.day, count: Number(r.count) })),
    },
    recentActivity: {
      ordersLast30Days: ordersLast30Days ?? 0,
      listingsLast30Days: listingsLast30Days ?? 0,
      usersLast30Days: usersLast30Days ?? 0,
    },
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

/**
 * Legacy parity: reef-trade-flow's admin UserManagementTab could block a
 * user outright. Uses Supabase's own auth ban (actually prevents sign-in,
 * unlike a cosmetic role flag) — `banned_at` on profiles is just a fast,
 * queryable mirror of that for the admin list/filter UI.
 */
export async function banUser(userId: string): Promise<Profile> {
  const db = supabaseAdmin();
  const { error: authError } = await db.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (authError) throw authError;
  const { data, error } = await db.from("profiles").update({ banned_at: new Date().toISOString() }).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function unbanUser(userId: string): Promise<Profile> {
  const db = supabaseAdmin();
  const { error: authError } = await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (authError) throw authError;
  const { data, error } = await db.from("profiles").update({ banned_at: null }).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export interface UserActivityStats {
  totalPurchases: number;
  totalSpent: number;
  totalSales: number;
  totalRevenue: number;
  activeListings: number;
  totalListings: number;
  lastActive: string | null;
}

/** Legacy parity: reef-trade-flow's per-user stats panel in admin user management. */
export async function getUserActivityStats(userId: string): Promise<UserActivityStats> {
  const db = supabaseAdmin();
  const [{ data: purchases }, { data: sales }, { count: activeListings }, { count: totalListings }, authUser] = await Promise.all([
    db.from("orders").select("total_charged").eq("buyer_id", userId).not("status", "in", "(pending,cancelled)"),
    db.from("orders").select("total_charged").eq("seller_id", userId).not("status", "in", "(pending,cancelled)"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", userId).eq("status", "active"),
    db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", userId),
    db.auth.admin.getUserById(userId),
  ]);

  return {
    totalPurchases: purchases?.length ?? 0,
    totalSpent: (purchases ?? []).reduce((sum, o) => sum + (o.total_charged ?? 0), 0),
    totalSales: sales?.length ?? 0,
    totalRevenue: (sales ?? []).reduce((sum, o) => sum + (o.total_charged ?? 0), 0),
    activeListings: activeListings ?? 0,
    totalListings: totalListings ?? 0,
    lastActive: authUser.data.user?.last_sign_in_at ?? null,
  };
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
