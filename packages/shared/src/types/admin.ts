export interface AdminStats {
  listings: { total: number; active: number; pending_approval: number; sold: number; removed: number };
  users: { total: number };
  reports: { pending: number };
  orders: { total: number; completed: number; doa_claim: number };
  visitors: { total: number; last7Days: number; last30Days: number };
}

export interface AdminAnalytics {
  orders: {
    total: number;
    completed: number;
    pending: number;
    revenue: { total: number; avg: number; byStatus: { completed: number; pending: number; cancelled: number } };
  };
  listings: { total: number; active: number; sold: number; removed: number };
  users: { total: number };
  reviews: { total: number; avgRating: number | null };
  visitors: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    uniqueSessions: number;
    authSessions: number;
    guestSessions: number;
    topPages: { path: string; count: number }[];
    visitsByDay: { date: string; count: number }[];
  };
  recentActivity: { ordersLast30Days: number; listingsLast30Days: number; usersLast30Days: number };
}
