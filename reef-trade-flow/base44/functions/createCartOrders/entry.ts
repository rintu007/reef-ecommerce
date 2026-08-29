/**
 * createCartOrders
 * Creates individual Order records for each item in a cart purchase.
 * Called from the frontend after a successful multi-item cart PaymentIntent.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const { listing_ids, payment_intent_id, breakdown } = await req.json();
    if (!listing_ids?.length) return Response.json({ error: 'listing_ids required' }, { status: 400 });

    const orders = [];

    for (const listing_id of listing_ids) {
      // Check for duplicate order
      const existing = await base44.asServiceRole.entities.Order.filter({
        listing_id,
        buyer_email: user.email,
        status: 'confirmed',
      });
      if (existing.length > 0) {
        orders.push(existing[0]);
        continue;
      }

      const listingRows = await base44.asServiceRole.entities.Listing.filter({ id: listing_id });
      const listing = listingRows[0];
      if (!listing) continue;

      // Find this listing's price from breakdown items
      const itemBreakdown = breakdown?.items?.find(i => i.id === listing_id);
      const price = itemBreakdown?.price || listing.price;

      const order = await base44.asServiceRole.entities.Order.create({
        listing_id,
        listing_title: listing.title,
        listing_photo: listing.photos?.[0] || '',
        buyer_email: user.email,
        seller_email: listing.seller_email,
        price,
        total_charged: price,
        sales_tax: 0,
        buyer_service_fee: 0,
        shipping_method: listing.shipping_available ? 'shipping' : 'local_pickup',
        status: 'confirmed',
        payment_intent_id: payment_intent_id || '',
        pickup_address: listing.pickup_address || '',
        notes: payment_intent_id ? `Cart payment: ${payment_intent_id}` : '',
      });

      // Decrement quantity
      const newQuantity = (listing.quantity || 1) - 1;
      if (newQuantity <= 0) {
        await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'sold' });
      } else {
        await base44.asServiceRole.entities.Listing.update(listing_id, { quantity: newQuantity });
      }

      orders.push(order);
    }

    return Response.json({ success: true, orders });
  } catch (error) {
    console.error('createCartOrders error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});