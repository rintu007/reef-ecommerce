/**
 * checkTrackingStatus
 * Scheduled — polls 17Track for all "shipped" orders every 2 hours.
 * On delivery:
 *   1. Marks order completed
 *   2. Transfers exact seller amount to their Stripe Connect account
 *   3. Platform fee + featured fee stay in the Reef Market Stripe account automatically
 *   4. Emails both parties
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const TRACK17_API_KEY = Deno.env.get('TRACK17_API_KEY');
const TRACK17_BASE = 'https://api.17track.net/track/v2.2';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Fallback fee constants (used only if PI metadata is missing)
const PLATFORM_FEE_RATE = 0.05;
const STRIPE_RATE = 0.029;
const STRIPE_FIXED = 30;
const SALES_TAX_RATE = 0.08;
const FEATURED_FEE_CENTS = 99;

async function checkWith17track(tracking_number) {
  if (!TRACK17_API_KEY) return null;

  // Register (idempotent)
  await fetch(`${TRACK17_BASE}/register`, {
    method: 'POST',
    headers: { '17token': TRACK17_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ number: tracking_number }]),
  });

  const res = await fetch(`${TRACK17_BASE}/gettrackinfo`, {
    method: 'POST',
    headers: { '17token': TRACK17_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ number: tracking_number }]),
  });

  const data = await res.json();
  const item = data?.data?.accepted?.[0];
  if (!item) return null;

  const latestStatus = item.track_info?.latest_status?.status;
  const latestEvent = item.track_info?.latest_event;

  const isDelivered =
    latestStatus === 'Delivered' ||
    latestStatus === 40 ||
    String(latestStatus) === '40';

  return { isDelivered, latestEvent: latestEvent?.description || '' };
}

/**
 * Release seller payout via Stripe Connect Transfer.
 * - Reads exact fee amounts from the PaymentIntent metadata (set at purchase time)
 * - Transfers seller_receives_cents to their Connect account
 * - Platform fee + featured fee remain in the Reef Market Stripe account (no action needed)
 * - Stripe's processing fee was already deducted from the charge automatically
 */
async function releaseSellerPayout(order, sellerAccount) {
  if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
    console.log(`Order ${order.id}: seller has no payouts-enabled Connect account — skipping transfer.`);
    return { skipped: true, reason: 'no_connect_account' };
  }

  if (!order.payment_intent_id) {
    console.log(`Order ${order.id}: no payment_intent_id — cannot transfer.`);
    return { skipped: true, reason: 'no_payment_intent' };
  }

  // Retrieve the PaymentIntent for charge ID and fee metadata
  const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
  if (!pi || pi.status !== 'succeeded') {
    console.log(`Order ${order.id}: PaymentIntent not succeeded (${pi?.status}) — skipping.`);
    return { skipped: true, reason: 'pi_not_succeeded' };
  }

  const chargeId = pi.latest_charge;
  if (!chargeId) {
    console.log(`Order ${order.id}: no charge ID on PI — skipping.`);
    return { skipped: true, reason: 'no_charge' };
  }

  // Read exact amounts from PI metadata (preferred) or calculate as fallback
  let sellerAmountCents;
  if (pi.metadata?.seller_receives_cents) {
    sellerAmountCents = parseInt(pi.metadata.seller_receives_cents, 10);
    console.log(`Order ${order.id}: Using PI metadata — seller receives $${(sellerAmountCents / 100).toFixed(2)}`);
    console.log(`  Breakdown — platform fee: $${(parseInt(pi.metadata.platform_fee_cents || '0') / 100).toFixed(2)}, featured fee: $${(parseInt(pi.metadata.featured_fee_cents || '0') / 100).toFixed(2)}, stripe fee: $${(parseInt(pi.metadata.stripe_fee_cents || '0') / 100).toFixed(2)}`);
  } else {
    // Fallback calculation for legacy orders
    const listingPriceCents = Math.round(order.price * 100);
    const salesTaxCents = Math.round(listingPriceCents * SALES_TAX_RATE);
    const totalChargeCents = listingPriceCents + salesTaxCents;
    const fullStripeFee = Math.round(totalChargeCents * STRIPE_RATE + STRIPE_FIXED);
    const platformFee = Math.round(listingPriceCents * PLATFORM_FEE_RATE);

    // Look up listing to check featured_fee flag
    const listings = await base44.asServiceRole.entities.Listing.filter({ id: order.listing_id });
    const listing = listings[0];
    const featuredFee = listing?.featured_fee ? FEATURED_FEE_CENTS : 0;

    sellerAmountCents = listingPriceCents - platformFee - fullStripeFee - featuredFee;
    console.log(`Order ${order.id}: Using fallback calculation — seller receives $${(sellerAmountCents / 100).toFixed(2)}`);
  }

  if (sellerAmountCents <= 0) {
    console.log(`Order ${order.id}: seller amount <= 0 — skipping.`);
    return { skipped: true, reason: 'zero_amount' };
  }

  // Idempotency: check if transfer already exists for this order
  const existingTransfers = await stripe.transfers.list({ transfer_group: order.listing_id, limit: 5 });
  const alreadyPaid = existingTransfers.data.some(
    (t) => t.destination === sellerAccount.stripe_account_id && t.metadata?.order_id === order.id
  );
  if (alreadyPaid) {
    console.log(`Order ${order.id}: transfer already exists — skipping duplicate.`);
    return { skipped: true, reason: 'already_transferred' };
  }

  // Create the Stripe Transfer — seller receives their net amount
  // Platform fee + featured fee remain in Reef Market's Stripe balance automatically
  const transfer = await stripe.transfers.create({
    amount: sellerAmountCents,
    currency: 'usd',
    destination: sellerAccount.stripe_account_id,
    source_transaction: chargeId,
    transfer_group: order.listing_id,
    metadata: {
      order_id: order.id,
      listing_id: order.listing_id,
      seller_email: order.seller_email,
      buyer_email: order.buyer_email,
      platform_fee_cents: pi.metadata?.platform_fee_cents || '',
      featured_fee_cents: pi.metadata?.featured_fee_cents || '0',
      stripe_fee_cents: pi.metadata?.stripe_fee_cents || '',
      reason: 'delivery_confirmed_auto',
    },
  });

  console.log(`Order ${order.id}: ✅ Transfer ${transfer.id} — $${(sellerAmountCents / 100).toFixed(2)} → ${sellerAccount.stripe_account_id}`);
  return { transfer_id: transfer.id, amount_cents: sellerAmountCents };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const shippedOrders = await base44.asServiceRole.entities.Order.filter({ status: 'shipped' });

  let checked = 0;
  let delivered = 0;
  let payoutsReleased = 0;

  for (const order of shippedOrders) {
    if (!order.tracking_number) continue;
    checked++;

    const result = await checkWith17track(order.tracking_number);
    if (!result?.isDelivered) continue;

    console.log(`Order ${order.id}: 17Track reports DELIVERED. Event: ${result.latestEvent}`);

    // 1. Update order status: delivered → completed
    await base44.asServiceRole.entities.Order.update(order.id, { status: 'delivered' });
    await base44.asServiceRole.entities.Order.update(order.id, { status: 'completed' });

    // 2. Mark listing sold
    await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

    delivered++;

    // 3. Look up seller Connect account and release payout
    const sellerAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({
      user_email: order.seller_email,
    });
    const payoutResult = await releaseSellerPayout(order, sellerAccounts[0]);

    if (payoutResult?.transfer_id) payoutsReleased++;

    // 4. Check & grant verified seller badge
    await base44.asServiceRole.functions.invoke('checkAndGrantVerifiedSeller', { seller_email: order.seller_email }).catch(() => {});

    // 5. Notify seller
    const sellerAmount = payoutResult?.amount_cents
      ? `$${(payoutResult.amount_cents / 100).toFixed(2)}`
      : 'your net amount (minus platform and processing fees)';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.seller_email,
      subject: `Payment released for "${order.listing_title}" 🎉`,
      body: `Hi,\n\nYour item "${order.listing_title}" has been confirmed delivered via tracking.\n\nYour payout of ${sellerAmount} has been sent to your connected bank account.\n\nThis reflects your listing price minus:\n- 5% Reef Market platform fee\n- Stripe processing fee (2.9% + $0.30)\n${payoutResult?.amount_cents && parseInt(payoutResult.amount_cents) < order.price * 100 - Math.round(order.price * 100 * 0.05) - Math.round((order.price * 100 + Math.round(order.price * 100 * 0.08)) * 0.029 + 30) ? '- $0.99 featured listing fee\n' : ''}\nThank you for selling on Reef Market!\n\n— The Reef Market Team`,
    }).catch((e) => console.log(`Seller email failed: ${e.message}`));

    // 5. Notify buyer
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Your order "${order.listing_title}" has been delivered! 📦`,
      body: `Hi,\n\nTracking confirms your order "${order.listing_title}" has been delivered successfully!\n\nWe hope you enjoy your new addition to your tank. If you have any issues, please reach out to support.\n\n— The Reef Market Team`,
    }).catch((e) => console.log(`Buyer email failed: ${e.message}`));
  }

  return Response.json({ checked, delivered, payoutsReleased });
});