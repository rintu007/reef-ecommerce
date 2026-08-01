/**
 * stripeWebhook
 * Handles all Stripe webhook events:
 *   - checkout.session.completed (subscription)
 *   - customer.subscription.updated / deleted (subscription)
 *   - payment_intent.succeeded (marketplace purchase → create order)
 *   - account.updated (Connect seller account status)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  const type = event.type;

  // ── Marketplace: payment succeeded → create order ──────────────────────
  if (type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const meta = pi.metadata || {};
    const { listing_id, listing_title, buyer_email, seller_email, shipping_method } = meta;
    const currency = (meta.currency || 'usd').toUpperCase();

    if (listing_id && buyer_email && seller_email) {
      // Get listing photo
      const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id });
      const listing = listings[0];

      // Avoid duplicate orders
      const existing = await base44.asServiceRole.entities.Order.filter({
        listing_id,
        buyer_email,
        status: 'confirmed',
      });

      if (existing.length === 0) {
        const isPickup = (shipping_method || '') === 'local_pickup';
        const order = await base44.asServiceRole.entities.Order.create({
          listing_id,
          listing_title,
          listing_photo: listing?.photos?.[0] || '',
          buyer_email,
          seller_email,
          price: Number(meta.listing_price_cents) / 100,
          total_charged: pi.amount / 100,
          sales_tax: 0,
          buyer_service_fee: 0,
          shipping_method: shipping_method || 'shipping',
          status: 'confirmed',
          payment_intent_id: pi.id,
          pickup_address: listing?.pickup_address || '',
          notes: `Payment: ${pi.id} | Currency: ${currency} | Platform fee: ${currency} ${(Number(meta.platform_fee_cents || 0) / 100).toFixed(2)}`,
        });

        // Send receipt email to buyer
        const itemPrice = (Number(meta.listing_price_cents) / 100).toFixed(2);
        const totalCharged = (pi.amount / 100).toFixed(2);
        const receiptLines = [
          `Item: ${listing_title}`,
          `Item price: ${currency} ${itemPrice}`,
          `Total charged: ${currency} ${totalCharged}`,
          '',
          isPickup
            ? `Pickup Address: ${listing?.pickup_address || 'The seller will provide the address'}`
            : 'Delivery: The seller will ship your item and provide tracking.',
          '',
          isPickup
            ? 'Funds are held securely and will be released to the seller once pickup is confirmed. If you do not confirm within 3 business days, pickup is assumed successful and funds are released automatically.'
            : 'Funds are held and released to the seller upon confirmed delivery.',
        ].join('\n');

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: buyer_email,
          subject: `Order Confirmed: ${listing_title}`,
          body: `Thank you for your purchase on Reef Market!\n\nHere is your receipt:\n\n${receiptLines}\n\nYou can view and manage your order in the Orders section of the app.\n\nReef Market`,
        });

        // Notify seller of sale with pickup/shipping details
        await base44.asServiceRole.functions.invoke('notifySellerOfSale', {
          order_id: order.id,
        });

        // Decrement quantity and remove listing if sold out
        const newQuantity = (listing?.quantity || 1) - 1;
        if (newQuantity <= 0) {
          // Remove listing when last item sold
          await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'sold' });
        } else {
          // Decrement quantity
          await base44.asServiceRole.entities.Listing.update(listing_id, { quantity: newQuantity });
        }
      }
    }

  // ── Subscription: checkout completed ────────────────────────────────────
  } else if (type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.metadata?.user_email;
    const planSlug = session.metadata?.plan_slug || 'pro';
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!userEmail) return Response.json({ received: true });

    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ user_email: userEmail });
    for (const s of existing.filter(s => s.status === 'active' || s.status === 'trialing')) {
      await base44.asServiceRole.entities.UserSubscription.update(s.id, { status: 'cancelled' });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await base44.asServiceRole.entities.UserSubscription.create({
      user_email: userEmail,
      plan_slug: planSlug,
      status: 'active',
      payment_provider: 'stripe',
      external_customer_id: customerId,
      external_subscription_id: subscriptionId,
      current_period_start: now.toISOString().split('T')[0],
      current_period_end: periodEnd.toISOString().split('T')[0],
    });

  // ── Subscription: updated ───────────────────────────────────────────────
  } else if (type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ external_customer_id: sub.customer });
    const record = existing[0];
    if (record) {
      const status = ['active', 'trialing', 'past_due'].includes(sub.status) ? sub.status : 'cancelled';
      await base44.asServiceRole.entities.UserSubscription.update(record.id, {
        status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString().split('T')[0],
        current_period_end: new Date(sub.current_period_end * 1000).toISOString().split('T')[0],
        external_subscription_id: sub.id,
      });
    }

  // ── Subscription: deleted ───────────────────────────────────────────────
  } else if (type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ external_customer_id: sub.customer });
    if (existing[0]) {
      await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, { status: 'cancelled' });
    }

  // ── Connect: seller account updated ────────────────────────────────────
  } else if (type === 'account.updated') {
    const account = event.data.object;
    const sellerAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({ stripe_account_id: account.id });
    if (sellerAccounts[0]) {
      await base44.asServiceRole.entities.SellerPayoutAccount.update(sellerAccounts[0].id, {
        payouts_enabled: account.payouts_enabled,
        onboarding_complete: account.details_submitted,
      });
    }
  }

  return Response.json({ received: true });
});