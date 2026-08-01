import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      // Not authenticated
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow authenticated users
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerEmail } = await req.json();

    if (!sellerEmail) {
      return Response.json({ error: 'Missing sellerEmail' }, { status: 400 });
    }

    // Get all completed orders for seller
    const orders = await base44.asServiceRole.entities.Order.filter({
      seller_email: sellerEmail,
      status: 'completed'
    });

    const completedCount = orders.length;

    // Get all reviews for seller
    const reviews = await base44.asServiceRole.entities.Review.filter({
      seller_email: sellerEmail,
      type: 'buyer_review'
    });

    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return Response.json({
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
      completedSales: completedCount,
      reviews: reviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});