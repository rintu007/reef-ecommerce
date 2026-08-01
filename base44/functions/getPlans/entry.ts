/**
 * getPlans
 * Returns all active membership plans for display on pricing/upgrade pages.
 * Falls back to hardcoded defaults if no plans exist in DB yet.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    price_monthly: 0,
    max_active_listings: 3,
    description: 'Perfect for casual sellers',
    features: ['Up to 3 active listings', 'Basic listing details', 'Message buyers'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price_monthly: 9.99,
    max_active_listings: 25,
    description: 'For serious hobbyists',
    features: ['Up to 25 active listings', 'Priority in search results', 'Message buyers', 'Shipping labels (coming soon)'],
  },
  {
    slug: 'business',
    name: 'Business',
    price_monthly: 24.99,
    max_active_listings: -1,
    description: 'For stores and large sellers',
    features: ['Unlimited active listings', 'Top search placement', 'Verified seller badge', 'Bulk listing tools (coming soon)', 'Dedicated support'],
  },
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const dbPlans = await base44.asServiceRole.entities.MembershipPlan.filter({ is_active: true });

  const plans = dbPlans.length > 0
    ? dbPlans.sort((a, b) => a.price_monthly - b.price_monthly)
    : DEFAULT_PLANS;

  return Response.json({ plans });
});