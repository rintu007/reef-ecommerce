/**
 * checkPendingPickups
 * Scheduled every hour — finds pickup orders where seller marked picked up
 * 72+ hours ago and buyer hasn't responded. Auto-releases funds via Stripe.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLATFORM_FEE_RATE = 0.05;
const STRIPE_RATE = 0.029;
const STRIPE_FIXED = 30;
const SALES_TAX_RATE = 0.08;
const FEATURED_FEE_CENTS = 99;

const HOURS_UNTIL_AUTO_RELEASE = 72;

async function transferToSeller(base44, order) {
  if (!order.payment_intent_id) return { skipped: true, reason: 'no_payment_intent' };

  const sellerPayoutAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({
    user_email: order.seller_email,
  });
  const sellerAccount = sellerPayoutAccounts[0];

  if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
    console.log(`Order ${order.id}: no payouts-enabled account`);
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
      reason: 'auto_release_72hr',
    },
  });

  return { transfer_id: transfer.id, amount_cents: sellerAmountCents };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req, { skipAuth: true });

  const pendingOrders = await base44.asServiceRole.entities.Order.filter({
    shipping_method: 'local_pickup',
    seller_marked_picked_up: true,
    buyer_confirmed_pickup: false,
    status: 'awaiting_pickup',
  });

  const now = new Date();
  let released = 0;

  for (const order of pendingOrders) {
    if (!order.seller_marked_picked_up_at) continue;

    const markedAt = new Date(order.seller_marked_picked_up_at);
    const hoursElapsed = (now - markedAt) / (1000 * 60 * 60);

    if (hoursElapsed < HOURS_UNTIL_AUTO_RELEASE) continue;

    console.log(`Order ${order.id}: ${hoursElapsed.toFixed(1)}h elapsed — auto-releasing`);

    await base44.asServiceRole.entities.Order.update(order.id, {
      status: 'completed',
      buyer_confirmed_pickup: true,
      notes: (order.notes || '') + ' | Auto-released after 72 hours without buyer response',
    });

    await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

    const transferResult = await transferToSeller(base44, order);
    const sellerAmount = transferResult.transfer_id
      ? `$${(transferResult.amount_cents / 100).toFixed(2)}`
      : 'your net amount (minus fees)';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Pickup auto-confirmed — ${order.listing_title}`,
      body: `Hi,\n\n72 hours have passed since the seller marked your item "${order.listing_title}" as picked up and you did not respond.\n\nAs per our buyer agreement, pickup has been automatically confirmed and funds have been released to the seller.\n\nIf you have any concerns, please contact Reef Market support.\n\n— The Reef Market Team`,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `Funds auto-released — "${order.listing_title}" 🎉`,
      body: `Hi,\n\n72 hours passed without the buyer responding to your pickup confirmation for "${order.listing_title}".\n\nPickup has been automatically confirmed and your payout of ${sellerAmount} has been sent to your connected bank account.\n\n— The Reef Market Team`,
    });

    if (transferResult.transfer_id) released++;
  }

  return Response.json({ success: true, released, checked: pendingOrders.length });
});