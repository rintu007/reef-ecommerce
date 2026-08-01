/**
 * notifyMatchingSavedSearches
 * Triggered by entity automation when a new Listing is created (status=active).
 * Finds all active SavedSearches that match the listing and emails each owner once.
 *
 * Payload from automation: { event, data: listing }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function listingMatchesSearch(listing, search) {
  if (search.listing_type && listing.listing_type !== search.listing_type) return false;
  if (search.category && listing.category !== search.category) return false;
  if (search.max_price != null && listing.price > search.max_price) return false;
  if (search.shipping_available && !listing.shipping_available) return false;
  if (search.local_pickup && !listing.local_pickup) return false;
  if (search.keyword) {
    const kw = search.keyword.toLowerCase();
    const haystack = [listing.title, listing.description, listing.species_name, listing.category]
      .filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const listing = body.data;

  if (!listing || listing.status !== 'active') {
    return Response.json({ skipped: true, reason: 'not an active listing' });
  }

  // Fetch all active saved searches
  const searches = await base44.asServiceRole.entities.SavedSearch.filter({ is_active: true });

  const matched = searches.filter(s => listingMatchesSearch(listing, s));

  if (matched.length === 0) {
    return Response.json({ success: true, notified: 0 });
  }

  // De-duplicate by user_email (one email per user even if multiple searches match)
  const byEmail = {};
  for (const s of matched) {
    if (!byEmail[s.user_email]) byEmail[s.user_email] = [];
    byEmail[s.user_email].push(s.name || 'Saved Search');
  }

  const listingUrl = `https://${req.headers.get('host') || 'reefmarket.app'}/listing/${listing.id}`;
  const photo = listing.photos?.[0] ? `<img src="${listing.photos[0]}" style="max-width:100%;border-radius:8px;margin-bottom:12px;" />` : '';

  let notified = 0;
  for (const [email, searchNames] of Object.entries(byEmail)) {
    const searchList = searchNames.map(n => `• ${n}`).join('<br>');
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `New listing match: ${listing.title}`,
      body: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:4px;">New listing matches your saved search</h2>
          <p style="color:#666;margin-top:0;">A listing was just posted that matches one of your saved searches.</p>
          ${photo}
          <h3 style="margin-bottom:4px;">${listing.title}</h3>
          <p style="font-size:22px;font-weight:bold;color:#0ea5e9;margin:4px 0;">$${listing.price}</p>
          ${listing.location ? `<p style="color:#666;font-size:14px;">📍 ${listing.location}</p>` : ''}
          <p style="font-size:13px;color:#888;margin-top:12px;">Matched your saved search${searchNames.length > 1 ? 'es' : ''}:<br>${searchList}</p>
          <a href="${listingUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">View Listing</a>
          <p style="margin-top:24px;font-size:12px;color:#aaa;">You can manage your saved searches in your profile. Reef Market.</p>
        </div>
      `,
    });
    notified++;
  }

  return Response.json({ success: true, notified });
});