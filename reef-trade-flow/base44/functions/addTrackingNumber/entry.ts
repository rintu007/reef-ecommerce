/**
 * addTrackingNumber
 * Called by seller to add a tracking number to a confirmed order.
 * - If seller is verified AND listing_type is coral: immediately release funds.
 * - Otherwise: mark as shipped and wait for delivery confirmation via checkTrackingStatus.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const CORAL_TYPES = ['coral'];

async function releaseSellerPayout(base44, order) {
  if (!order.payment_intent_id) return { skipped: true, reason: 'no_payment_intent' };

  const sellerAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({ user_email: order.seller_email });
  const sellerAccount = sellerAccounts[0];
  if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
    return { skipped: true, reason: 'no_connect_account' };
  }

  const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
  if (!pi || pi.status !== 'succeeded') return { skipped: true, reason: 'pi_not_succeeded' };

  const chargeId = pi.latest_charge;
  if (!chargeId) return { skipped: true, reason: 'no_charge' };

  let sellerAmountCents;
  if (pi.metadata?.seller_receives_cents) {
    sellerAmountCents = parseInt(pi.metadata.seller_receives_cents, 10);
  } else {
    const listingPriceCents = Math.round(order.price * 100);
    const platformFee = Math.round(listingPriceCents * 0.05);
    const totalChargeCents = Math.round(listingPriceCents * 1.08);
    const stripeFee = Math.round(totalChargeCents * 0.029 + 30);
    sellerAmountCents = listingPriceCents - platformFee - stripeFee;
  }

  if (sellerAmountCents <= 0) return { skipped: true, reason: 'zero_amount' };

  // Idempotency check
  const existing = await stripe.transfers.list({ transfer_group: order.listing_id, limit: 5 });
  const alreadyPaid = existing.data.some(t => t.destination === sellerAccount.stripe_account_id && t.metadata?.order_id === order.id);
  if (alreadyPaid) return { skipped: true, reason: 'already_transferred' };

  const transfer = await stripe.transfers.create({
    amount: sellerAmountCents,
    currency: 'usd',
    destination: sellerAccount.stripe_account_id,
    source_transaction: chargeId,
    transfer_group: order.listing_id,
    metadata: { order_id: order.id, seller_email: order.seller_email, reason: 'verified_coral_tracking_upload' },
  });

  return { transfer_id: transfer.id, amount_cents: sellerAmountCents };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { order_id, tracking_number, carrier } = await req.json();
  if (!tracking_number?.trim()) return Response.json({ error: 'Tracking number required' }, { status: 400 });

  const orders = await base44.entities.Order.filter({ id: order_id });
  const order = orders[0];
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.seller_email !== user.email) return Response.json({ error: 'Not your order' }, { status: 403 });
  if (!['confirmed', 'pending'].includes(order.status)) return Response.json({ error: 'Order cannot be updated' }, { status: 400 });

  const trackingNum = tracking_number.trim();
  const carrierName = carrier || 'unknown';

  // Check if this is a coral listing
  const listings = await base44.asServiceRole.entities.Listing.filter({ id: order.listing_id });
  const listing = listings[0];
  const isCoral = listing && CORAL_TYPES.includes(listing.listing_type);

  // Check if seller is verified
  const sellerUsers = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const sellerUser = sellerUsers[0];
  const isVerified = sellerUser?.verified_seller === true;

  const shouldReleaseFundsNow = isVerified && isCoral;

  if (shouldReleaseFundsNow) {
    // Mark completed immediately
    await base44.entities.Order.update(order.id, {
      tracking_number: trackingNum,
      carrier: carrierName,
      status: 'completed',
      shipping_date: new Date().toISOString().split('T')[0],
    });
    await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

    const payoutResult = await releaseSellerPayout(base44, order);

    const sellerAmount = payoutResult?.amount_cents
      ? `$${(payoutResult.amount_cents / 100).toFixed(2)}`
      : 'your net amount';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `✅ Funds released for "${order.listing_title}"`,
      body: `Hi,\n\nAs a verified seller, your funds of ${sellerAmount} for "${order.listing_title}" have been released immediately upon uploading your tracking number.\n\nThank you for selling on Reef Market!\n\n— The Reef Market Team`,
    }).catch(() => {});

    // Still notify buyer
    await base44.functions.invoke('notifyBuyerOfTracking', {
      order_id: order.id,
      tracking_number: trackingNum,
      carrier: carrierName,
    });

    return Response.json({ success: true, funds_released: true, verified_coral: true });
  }

  // Non-verified or non-coral: mark as shipped, wait for delivery
  await base44.entities.Order.update(order.id, {
    tracking_number: trackingNum,
    carrier: carrierName,
    status: 'shipped',
    shipping_date: new Date().toISOString().split('T')[0],
  });

  await base44.functions.invoke('notifyBuyerOfTracking', {
    order_id: order.id,
    tracking_number: trackingNum,
    carrier: carrierName,
  });

  return Response.json({ success: true, funds_released: false });
});