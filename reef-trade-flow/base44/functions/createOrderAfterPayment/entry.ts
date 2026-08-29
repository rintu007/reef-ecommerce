import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  const { listing_id, shipping_method, pickup_time, payment_intent_id, breakdown, quantity: reqQty } = await req.json();

  if (!listing_id) return Response.json({ error: 'listing_id required' }, { status: 400 });

  const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id });
  const listing = listings[0];
  if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

  const buyerEmail = user?.email;
  if (!buyerEmail) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  // Check for duplicate order (webhook may have already created it)
  const existing = await base44.asServiceRole.entities.Order.filter({
    listing_id,
    buyer_email: buyerEmail,
    status: 'confirmed',
  });

  if (existing.length > 0) {
    return Response.json({ success: true, order: existing[0], already_existed: true });
  }

  const purchasedQty = breakdown?.quantity || reqQty || 1;

  const order = await base44.asServiceRole.entities.Order.create({
    listing_id,
    listing_title: listing.title,
    listing_photo: listing.photos?.[0] || '',
    buyer_email: buyerEmail,
    seller_email: listing.seller_email,
    price: breakdown?.item_subtotal ?? breakdown?.listing_price ?? listing.price,
    total_charged: breakdown?.total_charged || listing.price,
    sales_tax: breakdown?.sales_tax || 0,
    buyer_service_fee: breakdown?.buyer_service_fee || 0,
    quantity: purchasedQty,
    shipping_method: shipping_method || 'shipping',
    status: 'confirmed',
    payment_intent_id: payment_intent_id || '',
    pickup_address: listing.pickup_address || '',
    pickup_time: pickup_time || '',
    notes: payment_intent_id ? `Payment: ${payment_intent_id}` : '',
  });

  // Decrement quantity immediately
  const newQuantity = (listing.quantity || 1) - purchasedQty;
  if (newQuantity <= 0) {
    await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'sold' });
  } else {
    await base44.asServiceRole.entities.Listing.update(listing_id, { quantity: newQuantity });
  }

  return Response.json({ success: true, order });
});