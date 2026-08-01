/**
 * cancelStripeSubscription
 * Cancels the user's active Stripe subscription at period end.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
  const activeSub = subs.find(s => s.status === 'active' || s.status === 'trialing');

  if (!activeSub?.external_subscription_id) {
    return Response.json({ error: 'No active subscription found' }, { status: 404 });
  }

  // Cancel at period end (user keeps access until billing period is up)
  await stripe.subscriptions.update(activeSub.external_subscription_id, {
    cancel_at_period_end: true,
  });

  await base44.entities.UserSubscription.update(activeSub.id, { status: 'cancelled' });

  return Response.json({ success: true });
});