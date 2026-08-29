import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, sellerEmail, listingId, rating, comment } = await req.json();

    if (!orderId || !sellerEmail || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check if review already exists for this order
    const existingReview = await base44.asServiceRole.entities.Review.filter({
      listing_id: listingId,
      seller_email: sellerEmail,
      reviewer_email: user.email,
    });

    if (existingReview.length > 0) {
      return Response.json({ error: 'You already reviewed this seller' }, { status: 400 });
    }

    // Create review
    const review = await base44.entities.Review.create({
      listing_id: listingId,
      seller_email: sellerEmail,
      reviewer_email: user.email,
      reviewer_name: user.full_name || user.email,
      rating: Math.round(rating),
      comment: comment || '',
      type: 'buyer_review'
    });

    return Response.json({ success: true, review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});