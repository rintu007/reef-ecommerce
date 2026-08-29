import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { action, user_id, user_email } = body;

  // Get user stats (purchases, sales, listings count)
  if (action === 'get_stats') {
    const [purchases, sales, listings] = await Promise.all([
      base44.asServiceRole.entities.Order.filter({ buyer_email: user_email }),
      base44.asServiceRole.entities.Order.filter({ seller_email: user_email }),
      base44.asServiceRole.entities.Listing.filter({ seller_email: user_email }),
    ]);

    const totalPurchases = purchases.length;
    const totalSales = sales.filter(o => ['completed', 'delivered'].includes(o.status)).length;
    const totalRevenue = sales
      .filter(o => ['completed', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.price || 0), 0);
    const totalSpent = purchases
      .filter(o => !['cancelled'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_charged || o.price || 0), 0);

    // Last active: most recent order (buy or sell) or listing created
    const allActivity = [
      ...purchases.map(o => o.created_date),
      ...sales.map(o => o.created_date),
      ...listings.map(l => l.updated_date || l.created_date),
    ].filter(Boolean).sort().reverse();

    const lastActive = allActivity[0] || null;

    return Response.json({
      totalPurchases,
      totalSales,
      totalRevenue,
      totalSpent,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalListings: listings.length,
      lastActive,
    });
  }

  // Block user (set role to "blocked")
  if (action === 'block') {
    await base44.asServiceRole.entities.User.update(user_id, { role: 'blocked' });
    return Response.json({ success: true });
  }

  // Unblock user
  if (action === 'unblock') {
    await base44.asServiceRole.entities.User.update(user_id, { role: 'user' });
    return Response.json({ success: true });
  }

  // Delete account: remove listings, cancel orders, delete user
  if (action === 'delete_account') {
    const [listings, orders] = await Promise.all([
      base44.asServiceRole.entities.Listing.filter({ seller_email: user_email }),
      base44.asServiceRole.entities.Order.filter({ seller_email: user_email }),
    ]);

    // Remove all listings
    await Promise.all(listings.map(l => base44.asServiceRole.entities.Listing.update(l.id, { status: 'removed' })));

    // Cancel pending orders
    const pendingOrders = orders.filter(o => ['pending', 'confirmed'].includes(o.status));
    await Promise.all(pendingOrders.map(o => base44.asServiceRole.entities.Order.update(o.id, { status: 'cancelled' })));

    // Delete user record
    await base44.asServiceRole.entities.User.delete(user_id);

    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});