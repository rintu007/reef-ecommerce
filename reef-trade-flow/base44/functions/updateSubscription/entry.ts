/**
 * updateSubscription
 * Creates or updates a user's subscription record.
 * Call this after a successful payment or when manually assigning a plan (admin).
 *
 * Body: { plan_slug, status?, payment_provider?, external_subscription_id?, external_customer_id? }
 *
 * Admins can pass target_email to update another user's subscription.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALID_SLUGS = ['free', 'pro', 'business'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { plan_slug, status = 'active', payment_provider, external_subscription_id, external_customer_id, target_email } = body;

  if (!VALID_SLUGS.includes(plan_slug)) {
    return Response.json({ error: `Invalid plan_slug. Must be one of: ${VALID_SLUGS.join(', ')}` }, { status: 400 });
  }

  // Only admins can update other users
  const targetEmail = (user.role === 'admin' && target_email) ? target_email : user.email;

  // Calculate period dates (monthly)
  const now = new Date();
  const periodStart = now.toISOString().split('T')[0];
  const periodEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0];

  const updateData = {
    user_email: targetEmail,
    plan_slug,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    ...(payment_provider && { payment_provider }),
    ...(external_subscription_id && { external_subscription_id }),
    ...(external_customer_id && { external_customer_id }),
  };

  // Upsert: cancel old active subs, create new one
  const existing = await base44.asServiceRole.entities.UserSubscription.filter({ user_email: targetEmail });
  const activeSubs = existing.filter(s => s.status === 'active' || s.status === 'trialing');

  for (const s of activeSubs) {
    await base44.asServiceRole.entities.UserSubscription.update(s.id, { status: 'cancelled' });
  }

  const newSub = await base44.asServiceRole.entities.UserSubscription.create(updateData);

  return Response.json({ success: true, subscription: newSub });
});