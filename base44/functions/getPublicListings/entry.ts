import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Create client without requiring user auth — service role uses app-level credentials
    const base44 = createClientFromRequest(req, { skipAuth: true });
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 2000;
    const filter = body.filter || {};

    // If filtering by a specific market, also include listings marked as "both"
    if (filter.market && filter.market !== "both") {
      const requestedMarket = filter.market;
      const [marketListings, bothListings] = await Promise.all([
        base44.asServiceRole.entities.Listing.filter({ ...filter, status: "active" }, "-created_date", limit),
        base44.asServiceRole.entities.Listing.filter({ ...filter, market: "both", status: "active" }, "-created_date", limit),
      ]);
      // Merge and deduplicate by id
      const seen = new Set();
      const listings = [...marketListings, ...bothListings].filter((l) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      return Response.json({ listings });
    }

    const listings = await base44.asServiceRole.entities.Listing.filter(
      { ...filter, status: "active" },
      "-created_date",
      limit
    );

    return Response.json({ listings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});