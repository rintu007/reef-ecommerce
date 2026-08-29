import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all orders
    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 1000);
    
    // Get all listings
    const listings = await base44.asServiceRole.entities.Listing.list('-created_date', 1000);
    
    // Get all users
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    
    // Get all reviews
    const reviews = await base44.asServiceRole.entities.Review.list('-created_date', 1000);

    // Get visitor logs
    const visitorLogs = await base44.asServiceRole.entities.VisitorLog.list('-created_date', 5000);

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_charged || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active').length;
    const soldListings = listings.filter(l => l.status === 'sold').length;
    const removedListings = listings.filter(l => l.status === 'removed').length;
    
    const totalUsers = users.length;
    
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : 0;

    // Visitor stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo2 = new Date(now); thirtyDaysAgo2.setDate(thirtyDaysAgo2.getDate() - 30);

    const totalVisits = visitorLogs.length;
    const uniqueSessions = new Set(visitorLogs.map(v => v.session_id)).size;
    const visitsToday = visitorLogs.filter(v => (v.created_date || '').startsWith(todayStr)).length;
    const visitsLast7Days = visitorLogs.filter(v => new Date(v.created_date) > sevenDaysAgo).length;
    const visitsLast30Days = visitorLogs.filter(v => new Date(v.created_date) > thirtyDaysAgo2).length;

    // Guest vs authenticated sessions
    const guestSessions = new Set(visitorLogs.filter(v => v.is_guest).map(v => v.session_id)).size;
    const authSessions = new Set(visitorLogs.filter(v => !v.is_guest).map(v => v.session_id)).size;

    // Top pages
    const pageCounts = {};
    visitorLogs.forEach(v => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([path, count]) => ({ path, count }));

    // Visits per day for last 30 days
    const dailyCounts = {};
    visitorLogs.filter(v => new Date(v.created_date) > thirtyDaysAgo2).forEach(v => {
      const day = (v.created_date || '').split('T')[0];
      if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    const visitsByDay = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // Revenue by status
    const revenueByStatus = {
      pending: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.total_charged || 0), 0),
      completed: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_charged || 0), 0),
      cancelled: orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + (o.total_charged || 0), 0),
    };

    // Orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(o => new Date(o.created_date) > thirtyDaysAgo).length;
    
    const thirtyDaysAgoListings = new Date();
    thirtyDaysAgoListings.setDate(thirtyDaysAgoListings.getDate() - 30);
    const recentListings = listings.filter(l => new Date(l.created_date) > thirtyDaysAgoListings).length;
    
    const thirtyDaysAgoUsers = new Date();
    thirtyDaysAgoUsers.setDate(thirtyDaysAgoUsers.getDate() - 30);
    const recentUsers = users.filter(u => new Date(u.created_date) > thirtyDaysAgoUsers).length;

    return Response.json({
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        revenue: {
          total: totalRevenue,
          avg: avgOrderValue,
          byStatus: revenueByStatus
        }
      },
      listings: {
        total: totalListings,
        active: activeListings,
        sold: soldListings,
        removed: removedListings
      },
      users: {
        total: totalUsers
      },
      reviews: {
        total: totalReviews,
        avgRating
      },
      recentActivity: {
        ordersLast30Days: recentOrders,
        listingsLast30Days: recentListings,
        usersLast30Days: recentUsers
      },
      visitors: {
        total: totalVisits,
        uniqueSessions,
        guestSessions,
        authSessions,
        today: visitsToday,
        last7Days: visitsLast7Days,
        last30Days: visitsLast30Days,
        topPages,
        visitsByDay
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});