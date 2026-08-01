/**
 * managePromoCodes — Admin only
 * Create, list, or deactivate promo codes.
 * Processing fees on sales are never waived by promo codes.
 *
 * Body:
 *   action: "create" | "list" | "deactivate"
 *   For create: { code, type, bonus_listings?, max_uses?, expires_at?, notes? }
 *   For deactivate: { code_id }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  if (action === 'list') {
    const codes = await base44.asServiceRole.entities.PromoCode.list('-created_date', 100);
    return Response.json({ codes });
  }

  if (action === 'create') {
    const { code, type, bonus_listings, max_uses, expires_at, notes } = body;
    if (!code || !type) return Response.json({ error: 'code and type are required' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.PromoCode.filter({ code: code.trim().toUpperCase() });
    if (existing.length > 0) return Response.json({ error: 'A code with that name already exists' }, { status: 409 });

    const created = await base44.asServiceRole.entities.PromoCode.create({
      code: code.trim().toUpperCase(),
      type,
      bonus_listings: bonus_listings || 0,
      max_uses: max_uses || 1,
      uses: 0,
      used_by: [],
      expires_at: expires_at || null,
      is_active: true,
      notes: notes || '',
    });
    return Response.json({ success: true, promo: created });
  }

  if (action === 'deactivate') {
    const { code_id } = body;
    if (!code_id) return Response.json({ error: 'code_id required' }, { status: 400 });
    await base44.asServiceRole.entities.PromoCode.update(code_id, { is_active: false });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
});