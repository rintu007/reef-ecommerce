import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, action } = await req.json();

    if (!listingId || !['save', 'unsave'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'save') {
      const existing = await base44.entities.Watchlist.filter({
        user_email: user.email,
        type: 'listing',
        listing_id: listingId
      });

      if (existing.length > 0) {
        return Response.json({ saved: true, message: 'Already saved' });
      }

      await base44.entities.Watchlist.create({
        user_email: user.email,
        type: 'listing',
        listing_id: listingId
      });

      return Response.json({ saved: true });
    } else {
      const existing = await base44.entities.Watchlist.filter({
        user_email: user.email,
        type: 'listing',
        listing_id: listingId
      });

      if (existing.length > 0) {
        await base44.entities.Watchlist.delete(existing[0].id);
      }

      return Response.json({ saved: false });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});