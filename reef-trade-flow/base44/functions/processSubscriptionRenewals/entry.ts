/**
 * processSubscriptionRenewals
 * Runs daily to check for expired subscriptions.
 *
 * Logic per expired subscription:
 *  - payment_provider === 'stripe'  → skip (Stripe webhooks handle this)
 *  - payment_provider === 'manual' (promo codes / admin grants) → downgrade to 'free'
 *  - status === 'past_due' already  → downgrade to 'free'
 *  - otherwise                      → mark as 'past_due' (gives a grace period until next run)
 *
 * A new 'free' subscription record is created for any downgraded user.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled/internal calls (no user session) OR admin users
  let isAdmin = false;
  const user = await base44.auth.me().catch(() => null);
  if (user) {
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    isAdmin = true;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch all active / trialing non-free subscriptions whose period has ended
  const allActiveSubs = await base44.asServiceRole.entities.UserSubscription.filter({ status: 'active' });
  const trialingSubs = await base44.asServiceRole.entities.UserSubscription.filter({ status: 'trialing' });
  const pastDueSubs = await base44.asServiceRole.entities.UserSubscription.filter({ status: 'past_due' });

  const candidates = [...allActiveSubs, ...trialingSubs, ...pastDueSubs].filter(s => {
    // Only non-free plans
    if (s.plan_slug === 'free') return false;
    // Must have a period end date that has passed
    if (!s.current_period_end) return false;
    return s.current_period_end < today;
  });

  const results = { renewed: [], downgraded: [], skipped: [] };

  for (const sub of candidates) {
    // Skip Stripe — their webhook handles renewal / failure
    if (sub.payment_provider === 'stripe') {
      results.skipped.push({ id: sub.id, email: sub.user_email, reason: 'stripe_managed' });
      continue;
    }

    // If already past_due on a previous run → downgrade to free now
    const shouldDowngrade = sub.status === 'past_due' || sub.payment_provider === 'manual';

    if (shouldDowngrade) {
      // Cancel this subscription
      await base44.asServiceRole.entities.UserSubscription.update(sub.id, { status: 'cancelled' });

      // Create a new free subscription
      const now = new Date();
      const periodStart = now.toISOString().split('T')[0];
      const periodEnd = new Date(new Date().setMonth(now.getMonth() + 1)).toISOString().split('T')[0];

      await base44.asServiceRole.entities.UserSubscription.create({
        user_email: sub.user_email,
        plan_slug: 'free',
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        payment_provider: 'system',
      });

      results.downgraded.push({ id: sub.id, email: sub.user_email, from_plan: sub.plan_slug });
    } else {
      // First expiry — mark past_due (grace period)
      await base44.asServiceRole.entities.UserSubscription.update(sub.id, { status: 'past_due' });
      results.renewed.push({ id: sub.id, email: sub.user_email, action: 'marked_past_due' });
    }
  }

  return Response.json({
    success: true,
    processed: candidates.length,
    results,
    run_at: new Date().toISOString(),
  });
});