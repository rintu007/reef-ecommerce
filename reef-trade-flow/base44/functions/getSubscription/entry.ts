/**
 * getSubscription
 * Returns the current user's active subscription + plan details + listing usage.
 * If no subscription record exists, defaults to the "free" plan.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const PLAN_DEFAULTS = {
  free:     { max_active_listings: 5,  price_monthly: 0 },
  pro:      { max_active_listings: -1, price_monthly: 9.99 },
  business: { max_active_listings: -1, price_monthly: 24.99 },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch subscription record
  const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
  const sub = subs.find(s => s.status === 'active' || s.status === 'trialing') || null;
  const planSlug = sub?.plan_slug ?? 'free';

  // Fetch plan config (from DB if exists, fallback to hardcoded defaults)
  const plans = await base44.entities.MembershipPlan.filter({ slug: planSlug, is_active: true });
  const plan = plans[0] ?? { ...PLAN_DEFAULTS[planSlug], slug: planSlug, name: planSlug };

  // Count current active listings
  const activeListings = await base44.entities.Listing.filter({
    seller_email: user.email,
    status: 'active',
  });
  const activeCount = activeListings.length;

  const maxListings = plan.max_active_listings ?? PLAN_DEFAULTS[planSlug]?.max_active_listings ?? 3;
  const canCreateListing = maxListings === -1 || activeCount < maxListings;

  return Response.json({
    subscription: sub,
    plan: {
      slug: plan.slug ?? planSlug,
      name: plan.name ?? planSlug,
      price_monthly: plan.price_monthly ?? 0,
      max_active_listings: maxListings,
    },
    usage: {
      active_listings: activeCount,
      max_active_listings: maxListings,
      can_create_listing: canCreateListing,
    },
  });
});