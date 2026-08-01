/**
 * releasePaymentToSeller
 * Called when the buyer confirms receipt of a SHIPPED item.
 * With application_fee_amount + transfer_data on the PaymentIntent,
 * Stripe handles the transfer automatically — this function just marks
 * the order complete and emails the seller.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { order_id } = await req.json();

  const orders = await base44.entities.Order.filter({ id: order_id });
  const order = orders[0];
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.buyer_email !== user.email) return Response.json({ error: 'Not your order' }, { status: 403 });
  if (order.status === 'completed') return Response.json({ error: 'Already confirmed' }, { status: 400 });

  if (order.shipping_method === 'local_pickup') {
    return Response.json({ error: 'Use confirmLocalPickup for pickup orders' }, { status: 400 });
  }
  if (!['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    return Response.json({ error: 'Order cannot be confirmed in its current state' }, { status: 400 });
  }

  // Mark order completed
  await base44.entities.Order.update(order.id, { status: 'completed' });
  await base44.asServiceRole.entities.Listing.update(order.listing_id, { status: 'sold' });

  // Check & grant verified seller badge
  await base44.asServiceRole.functions.invoke('checkAndGrantVerifiedSeller', { seller_email: order.seller_email }).catch(() => {});

  // Retrieve the PaymentIntent to confirm transfer details
  let sellerAmount = 'your net amount (minus fees)';
  if (order.payment_intent_id) {
    try {
      const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      if (pi?.metadata?.seller_receives_cents) {
        const currency = (pi.metadata.currency || 'usd').toUpperCase();
        const amount = (parseInt(pi.metadata.seller_receives_cents, 10) / 100).toFixed(2);
        sellerAmount = `${amount} ${currency}`;
      }
    } catch (e) {
      console.error('Could not retrieve PI:', e.message);
    }
  }

  // Email seller — transfer was already handled by Stripe via transfer_data on the PaymentIntent
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.seller_email,
    subject: `Payment released for "${order.listing_title}" 🎉`,
    body: `Hi,\n\nThe buyer has confirmed receipt of "${order.listing_title}".\n\nYour payout of ${sellerAmount} has been sent to your connected bank account (minus the 5% Reef Market fee and Stripe processing fee).\n\nThank you for selling on Reef Market!\n\n— The Reef Market Team`,
  }).catch(() => {});

  return Response.json({ success: true, seller_amount: sellerAmount });
});