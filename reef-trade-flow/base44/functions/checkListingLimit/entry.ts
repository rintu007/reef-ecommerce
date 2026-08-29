/**
 * checkListingLimit
 * Users with a connected payout account (sellers) can post unlimited listings.
 * Returns { allowed: boolean, reason?: string, usage: { active, max } }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if the user has a connected payout account — if so, unlimited listings
  const accounts = await base44.entities.SellerPayoutAccount.filter({ user_email: user.email });
  const hasPayoutAccount = accounts.length > 0;

  // Count active listings
  const activeListings = await base44.entities.Listing.filter({
    seller_email: user.email,
    status: 'active',
  });
  const activeCount = activeListings.length;

  // All users get unlimited listings
  return Response.json({
    allowed: true,
    usage: { active: activeCount, max: -1 },
  });
});