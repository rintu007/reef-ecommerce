import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete user's listings
  const listings = await base44.entities.Listing.filter({ seller_email: user.email });
  for (const listing of listings) {
    await base44.entities.Listing.delete(listing.id);
  }

  // Delete user's messages
  const sentMessages = await base44.entities.Message.filter({ sender_email: user.email });
  const receivedMessages = await base44.entities.Message.filter({ receiver_email: user.email });
  for (const msg of [...sentMessages, ...receivedMessages]) {
    await base44.entities.Message.delete(msg.id);
  }

  // Delete user's reviews
  const reviews = await base44.entities.Review.filter({ reviewer_email: user.email });
  for (const review of reviews) {
    await base44.entities.Review.delete(review.id);
  }

  // Delete saved searches
  const searches = await base44.entities.SavedSearch.filter({ user_email: user.email });
  for (const s of searches) {
    await base44.entities.SavedSearch.delete(s.id);
  }

  // Delete payout account
  const payoutAccounts = await base44.entities.SellerPayoutAccount.filter({ user_email: user.email });
  for (const pa of payoutAccounts) {
    await base44.entities.SellerPayoutAccount.delete(pa.id);
  }

  return Response.json({ success: true });
});