/**
 * confirmLocalPickup
 * Handles all local pickup confirmation flows:
 *   - seller_mark_pickup: seller marks item as handed off, buyer notified
 *   - buyer_confirm_pickup: buyer confirms, funds transferred to seller
 *   - buyer_deny_pickup: buyer denies, seller notified to investigate
 *   - auto_release: called by scheduler after 72 hours with no buyer response
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLATFORM_FEE_RATE = 0.05;
const STRIPE_RATE = 0.029;
const STRIPE_FIXED = 30;
const SALES_TAX_RATE = 0.08;
const FEATURED_FEE_CENTS = 99;

async function transferToSeller(base44, order, reason) {
  if (!order.payment_intent_id) return { skipped: true, reason: 'no_payment_intent' };

  const sellerPayoutAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({
    user_email: order.seller_email,
  });
  const sellerAccount = sellerPayoutAccounts[0];

  if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
    console.log(`Order ${order.id}: seller has no payouts-enabled account — skipping transfer`);
    return { skipped: true, reason: 'no_connect_account' };
  }

  const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
  if (!pi || pi.status !== 'succeeded' || !pi.latest_charge) {
    return { skipped: true, reason: 'pi_not_succeeded' };
  }

  let sellerAmountCents;
  if (pi.metadata?.seller_receives_cents) {
    sellerAmountCents = parseInt(pi.metadata.seller_receives_cents, 10);
  } else {
    const listingPriceCents = Math.round(order.price * 100);
    const salesTaxCents = Math.round(listingPriceCents * SALES_TAX_RATE);
    const totalChargeCents = listingPriceCents + salesTaxCents;
    const fullStripeFee = Math.round(totalChargeCents * STRIPE_RATE + STRIPE_FIXED);
    const platformFee = Math.round(listingPriceCents * PLATFORM_FEE_RATE);
    const listings = await base44.asServiceRole.entities.Listing.filter({ id: order.listing_id });
    const featuredFee = listings[0]?.featured_fee ? FEATURED_FEE_CENTS : 0;
    sellerAmountCents = listingPriceCents - platformFee - fullStripeFee - featuredFee;
  }

  if (sellerAmountCents <= 0) return { skipped: true, reason: 'zero_amount' };

  // Idempotency check
  const existingTransfers = await stripe.transfers.list({ transfer_group: order.listing_id, limit: 5 });
  const alreadyPaid = existingTransfers.data.some(
    (t) => t.destination === sellerAccount.stripe_account_id && t.metadata?.order_id === order.id
  );
  if (alreadyPaid) return { skipped: true, reason: 'already_transferred' };

  const transfer = await stripe.transfers.create({
    amount: sellerAmountCents,
    currency: 'usd',
    destination: sellerAccount.stripe_account_id,
    source_transaction: pi.latest_charge,
    transfer_group: order.listing_id,
    metadata: {
      order_id: order.id,
      listing_id: order.listing_id,
      seller_email: order.seller_email,
      reason,
    },
  });

  return { transfer_id: transfer.id, amount_cents: sellerAmountCents };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req, { skipAuth: true });
  const body = await req.json();
  const { order_id, action, auto_release } = body;

  let user = null;
  if (!auto_release) {
    user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
  const order = orders[0];
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.shipping_method !== 'local_pickup') return Response.json({ error: 'Not a pickup order' }, { status: 400 });

  // ── Seller marks item as picked up ──────────────────────────────────────
  if (action === 'seller_mark_pickup') {
    if (!auto_release && user.email !== order.seller_email) {
      return Response.json({ error: 'Only the seller can mark pickup' }, { status: 403 });
    }
    if (order.seller_marked_picked_up) {
      return Response.json({ error: 'Already marked as picked up' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Order.update(order.id, {
      seller_marked_picked_up: true,
      seller_marked_picked_up_at: new Date().toISOString(),
      status: 'awaiting_pickup',
    });

    // Email buyer to confirm or deny pickup
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Did you pick up your item? — ${order.listing_title}`,
      body: `Hi,

The seller has marked your item "${order.listing_title}" as picked up.

Please log in to Reef Market and go to your Orders page to confirm or deny that this pickup occurred.

✅ If you DID receive the item, tap "Confirm Pickup" to release funds to the seller.
❌ If you did NOT receive the item, tap "Deny Pickup" and we will notify the seller.

If you do not respond within 72 hours, pickup will be automatically confirmed and funds will be released to the seller.

— The Reef Market Team`,
    });

    return Response.json({ success: true, message: 'Pickup marked, buyer notified' });
  }

  // ── Buyer confirms pickup → transfer funds to seller ────────────────────
  if (action === 'buyer_confirm_pickup') {
    if (!auto_release && user.email !== order.buyer_email) {
      return Response.json({ error: 'Only the buyer can confirm pickup' }, { status: 403 });
    }
    if (order.status === 'completed') return Response.json({ error: 'Already completed' }, { status: 400 });

    await base44.asServiceRole.entities.Order.update(order.id, {
      buyer_confirmed_pickup: true,
      status: 'completed',
    });

    await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

    const transferResult = await transferToSeller(base44, order, 'buyer_confirmed_pickup');
    const sellerAmount = transferResult.transfer_id
      ? `$${(transferResult.amount_cents / 100).toFixed(2)}`
      : 'your net amount (minus fees)';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `Pickup confirmed — funds released for "${order.listing_title}" 🎉`,
      body: `Hi,

The buyer has confirmed pickup of "${order.listing_title}".

Your payout of ${sellerAmount} has been sent to your connected bank account (minus 5% Reef Market fee and Stripe processing fee).

You should receive your payout within 2–7 business days.

— The Reef Market Team`,
    });

    return Response.json({ success: true, message: 'Pickup confirmed, funds released' });
  }

  // ── Buyer denies pickup → notify seller ─────────────────────────────────
  if (action === 'buyer_deny_pickup') {
    if (user.email !== order.buyer_email) {
      return Response.json({ error: 'Only the buyer can deny pickup' }, { status: 403 });
    }
    if (order.status === 'completed') return Response.json({ error: 'Order already completed' }, { status: 400 });

    await base44.asServiceRole.entities.Order.update(order.id, {
      status: 'confirmed', // Revert to confirmed so seller must re-mark
      seller_marked_picked_up: false,
      seller_marked_picked_up_at: null,
      notes: (order.notes || '') + ' | Buyer denied pickup — seller notified to investigate',
    });

    // Notify seller
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `⚠️ Buyer denied pickup — ${order.listing_title}`,
      body: `Hi,

The buyer has denied that they picked up "${order.listing_title}".

This means the buyer is saying the pickup did NOT occur. Funds have NOT been released.

Please contact the buyer or reach out to Reef Market support to resolve this dispute.

Order details:
- Item: ${order.listing_title}
- Buyer: ${order.buyer_email}
- Pickup address: ${order.pickup_address || 'N/A'}
- Scheduled time: ${order.pickup_time || 'N/A'}

— The Reef Market Team`,
    });

    // Notify buyer that their denial was recorded
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Pickup denial recorded — ${order.listing_title}`,
      body: `Hi,

We've recorded that you denied the pickup of "${order.listing_title}" and notified the seller.

Funds have NOT been released to the seller. If you cannot resolve this with the seller directly, please contact Reef Market support.

— The Reef Market Team`,
    });

    return Response.json({ success: true, message: 'Pickup denied, seller notified' });
  }

  // ── Auto-release after 72 hours (called by scheduler) ───────────────────
  if (action === 'auto_release') {
    if (order.status === 'completed' || order.buyer_confirmed_pickup) {
      return Response.json({ success: true, message: 'Already completed' });
    }

    await base44.asServiceRole.entities.Order.update(order.id, {
      status: 'completed',
      buyer_confirmed_pickup: true,
      notes: (order.notes || '') + ' | Auto-released after 72 hours without buyer response',
    });

    await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

    const transferResult = await transferToSeller(base44, order, 'auto_release_72hr');
    const sellerAmount = transferResult.transfer_id
      ? `$${(transferResult.amount_cents / 100).toFixed(2)}`
      : 'your net amount (minus fees)';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Pickup auto-confirmed — ${order.listing_title}`,
      body: `Hi,

72 hours have passed since the seller marked your item "${order.listing_title}" as picked up and you did not respond.

As per our buyer agreement, pickup has been automatically confirmed and funds have been released to the seller.

If you have any concerns, please contact Reef Market support.

— The Reef Market Team`,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `Funds auto-released — "${order.listing_title}" 🎉`,
      body: `Hi,

72 hours passed without the buyer responding to your pickup confirmation for "${order.listing_title}".

Pickup has been automatically confirmed and your payout of ${sellerAmount} has been sent to your connected bank account.

— The Reef Market Team`,
    });

    return Response.json({ success: true, message: 'Auto-released after 72 hours' });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
});