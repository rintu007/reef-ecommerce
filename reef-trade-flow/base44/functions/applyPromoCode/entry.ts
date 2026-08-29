/**
 * applyPromoCode
 * Lets a logged-in user redeem a promo code.
 * - free_membership_6mo / free_membership_1yr: updates UserSubscription
 * - bonus_listings: stores extra slots on the user record
 * Processing fee on sales is NOT affected.
 *
 * Body: { code: string }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return Response.json({ error: 'Missing code' }, { status: 400 });

  // Find the promo code (case-insensitive)
  const codes = await base44.asServiceRole.entities.PromoCode.filter({ code: code.trim().toUpperCase() });
  const promo = codes[0];

  if (!promo || !promo.is_active) {
    return Response.json({ error: 'Invalid or expired promo code' }, { status: 404 });
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return Response.json({ error: 'This promo code has expired' }, { status: 410 });
  }
  if (promo.uses >= promo.max_uses) {
    return Response.json({ error: 'This promo code has already been fully redeemed' }, { status: 409 });
  }
  if (promo.used_by?.includes(user.email)) {
    return Response.json({ error: 'You have already used this promo code' }, { status: 409 });
  }

  const now = new Date();
  let result = {};

  if (promo.type === 'free_membership_6mo' || promo.type === 'free_membership_1yr') {
    const months = promo.type === 'free_membership_6mo' ? 6 : 12;
    const end = new Date(now);
    end.setMonth(end.getMonth() + months);
    const endDate = end.toISOString().split('T')[0];
    const startDate = now.toISOString().split('T')[0];
    const planSlug = months === 6 ? 'pro' : 'business';

    // Upsert subscription
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({ user_email: user.email });
    if (existing[0]) {
      await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
        plan_slug: planSlug,
        status: 'active',
        current_period_start: startDate,
        current_period_end: endDate,
        payment_provider: 'promo',
        external_subscription_id: promo.code,
      });
    } else {
      await base44.asServiceRole.entities.UserSubscription.create({
        user_email: user.email,
        plan_slug: planSlug,
        status: 'active',
        current_period_start: startDate,
        current_period_end: endDate,
        payment_provider: 'promo',
        external_subscription_id: promo.code,
      });
    }
    result = { granted: `${planSlug} membership until ${endDate}` };

  } else if (promo.type === 'bonus_listings') {
    const extra = promo.bonus_listings || 0;
    const current = user.bonus_listing_slots || 0;
    await base44.auth.updateMe({ bonus_listing_slots: current + extra });
    result = { granted: `${extra} bonus listing slots added` };
  }

  // Mark as used
  await base44.asServiceRole.entities.PromoCode.update(promo.id, {
    uses: (promo.uses || 0) + 1,
    used_by: [...(promo.used_by || []), user.email],
  });

  return Response.json({ success: true, ...result });
});