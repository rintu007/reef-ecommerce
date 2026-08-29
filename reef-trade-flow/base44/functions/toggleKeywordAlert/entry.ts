import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword, market, action } = await req.json();

    if (!keyword || !['add', 'remove'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const trimmedKeyword = keyword.trim().toLowerCase();

    if (action === 'add') {
      const existing = await base44.entities.Watchlist.filter({
        user_email: user.email,
        type: 'keyword',
        keyword: trimmedKeyword
      });

      if (existing.length > 0) {
        return Response.json({ created: false, message: 'Already watching' });
      }

      await base44.entities.Watchlist.create({
        user_email: user.email,
        type: 'keyword',
        keyword: trimmedKeyword,
        market: market || null
      });

      return Response.json({ created: true });
    } else {
      const existing = await base44.entities.Watchlist.filter({
        user_email: user.email,
        type: 'keyword',
        keyword: trimmedKeyword
      });

      if (existing.length > 0) {
        await base44.entities.Watchlist.delete(existing[0].id);
      }

      return Response.json({ deleted: true });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});