import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return Response.json({ error: 'Missing listingId' }, { status: 400 });
    }

    const listing = await base44.entities.Listing.filter({ id: listingId });
    if (!listing.length) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Allow admin or listing seller to delete
    if (user.role !== 'admin' && listing[0].seller_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Listing.delete(listingId);

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});