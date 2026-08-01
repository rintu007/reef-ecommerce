/**
 * createStripeCheckout
 * Creates a Stripe Checkout session for the $9.99/mo hobbyist plan.
 * Returns { url } to redirect the user to.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Hardcoded price — replace with your actual Stripe Price ID after creating the product in Stripe dashboard
// OR this function will create it dynamically on first call.
const PLAN_PRICE_AMOUNT = 999; // $9.99 in cents
const PLAN_NAME = 'Hobbyist Premium';
const PLAN_SLUG = 'pro';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const origin = req.headers.get('origin') || 'https://reefmarket.app';

  // Look up or create a Stripe customer for this user
  const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
  const existingSub = subs.find(s => s.status === 'active' || s.status === 'trialing');
  let customerId = existingSub?.external_customer_id;

  if (!customerId) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email, name: user.full_name });
      customerId = customer.id;
    }
  }

  // Find or create the recurring price
  let priceId;
  const prices = await stripe.prices.list({ active: true, type: 'recurring', limit: 100 });
  const existing = prices.data.find(p =>
    p.unit_amount === PLAN_PRICE_AMOUNT &&
    p.currency === 'usd' &&
    p.recurring?.interval === 'month' &&
    p.metadata?.plan_slug === PLAN_SLUG
  );

  if (existing) {
    priceId = existing.id;
  } else {
    const product = await stripe.products.create({ name: PLAN_NAME, metadata: { plan_slug: PLAN_SLUG } });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PLAN_PRICE_AMOUNT,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_slug: PLAN_SLUG },
    });
    priceId = price.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/profile?checkout=success`,
    cancel_url: `${origin}/profile?checkout=cancelled`,
    metadata: { user_email: user.email, plan_slug: PLAN_SLUG },
  });

  return Response.json({ url: session.url });
});