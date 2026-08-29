/**
 * createPaymentIntent
 * Creates a Stripe PaymentIntent for a listing purchase.
 * Supports multi-currency, quantity, and tiered/flat shipping costs.
 * The 5% platform fee is applied to the item subtotal only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLATFORM_FEE_RATE = 0.05;
const STRIPE_RATE = 0.029;
const STRIPE_FIXED = 30; // cents
const FEATURED_FEE_CENTS = 99;

function computeShipping(listing, qty, method) {
  if (method !== 'shipping') return 0;
  const tiers = (listing.shipping_tiers || []).slice().sort((a, b) => a.up_to_qty - b.up_to_qty);
  if (tiers.length === 0) return listing.shipping_cost || 0;
  const tier = tiers.find(t => qty <= t.up_to_qty);
  return tier ? tier.price : tiers[tiers.length - 1].price;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const { listing_id, shipping_method, quantity: reqQty, buyer_email: guestEmail } = await req.json();

    const buyerEmail = user?.email || guestEmail;
    if (!buyerEmail) return Response.json({ error: 'Email is required to purchase' }, { status: 400 });

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id });
    const listing = listings[0];
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.status === 'sold') return Response.json({ error: 'Listing already sold' }, { status: 400 });
    if (listing.seller_email === buyerEmail) return Response.json({ error: 'Cannot buy your own listing' }, { status: 400 });

    const quantity = Math.max(1, parseInt(reqQty) || 1);
    const minQty = listing.min_qty || 1;
    if (quantity < minQty) {
      return Response.json({ error: `Minimum order quantity is ${minQty}` }, { status: 400 });
    }
    if (quantity > (listing.quantity || 1)) {
      return Response.json({ error: 'Not enough stock available' }, { status: 400 });
    }
    const minOrderAmount = listing.min_order_amount || 0;
    if (minOrderAmount > 0 && listing.price * quantity < minOrderAmount) {
      return Response.json({ error: `Minimum order amount is ${listing.currency || 'USD'} ${minOrderAmount.toFixed(2)}` }, { status: 400 });
    }

    // Get the seller's connected Stripe account
    const sellerPayoutAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({ user_email: listing.seller_email });
    const sellerAccount = sellerPayoutAccounts[0];
    if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
      return Response.json({ error: 'Seller has not completed payout setup' }, { status: 400 });
    }

    const currency = (listing.currency || 'usd').toLowerCase();
    const resolvedShippingMethod = shipping_method || (listing.shipping_available ? 'shipping' : 'local_pickup');

    const itemSubtotalCents = Math.round(listing.price * quantity * 100);
    const shippingCost = computeShipping(listing, quantity, resolvedShippingMethod);
    const shippingCents = Math.round(shippingCost * 100);
    const totalCents = itemSubtotalCents + shippingCents;

    const platformFeeCents = Math.round(itemSubtotalCents * PLATFORM_FEE_RATE);
    const featuredFeeDeduction = listing.featured_fee ? FEATURED_FEE_CENTS : 0;

    const pi = await stripe.paymentIntents.create({
      amount: totalCents,
      currency,
      application_fee_amount: platformFeeCents + featuredFeeDeduction,
      transfer_data: { destination: sellerAccount.stripe_account_id },
      metadata: {
        listing_id: listing.id,
        listing_title: listing.title,
        buyer_email: buyerEmail,
        seller_email: listing.seller_email,
        shipping_method: resolvedShippingMethod,
        quantity: String(quantity),
        item_subtotal_cents: String(itemSubtotalCents),
        shipping_cents: String(shippingCents),
        platform_fee_cents: String(platformFeeCents),
        featured_fee_cents: String(featuredFeeDeduction),
        currency,
      },
    });

    const fullStripeFee = Math.round(totalCents * STRIPE_RATE + STRIPE_FIXED);
    const sellerReceivesCents = itemSubtotalCents - platformFeeCents - fullStripeFee - featuredFeeDeduction;

    const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || Deno.env.get('VITE_STRIPE_PUBLISHABLE_KEY');

    return Response.json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      publishable_key: STRIPE_PUBLISHABLE_KEY,
      currency,
      breakdown: {
        listing_price: listing.price,
        quantity,
        item_subtotal: itemSubtotalCents / 100,
        shipping_cost: shippingCost,
        currency,
        total_charged: totalCents / 100,
        platform_fee: platformFeeCents / 100,
        featured_fee: featuredFeeDeduction / 100,
        stripe_fee: fullStripeFee / 100,
        seller_receives: sellerReceivesCents / 100,
      },
    });
  } catch (error) {
    console.error('createPaymentIntent error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});