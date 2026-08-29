/**
 * createConnectAccount
 * Creates or retrieves a Stripe Connect Express account for the seller,
 * then returns an onboarding link URL.
 * Supports international sellers — Stripe handles local banking/currency per country.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const origin = req.headers.get('origin') || 'https://reefmarket.app';

  // Check if seller already has a Connect account
  const accounts = await base44.entities.SellerPayoutAccount.filter({ user_email: user.email });
  let account = accounts[0];

  let stripeAccountId = account?.stripe_account_id;

  if (!stripeAccountId) {
    // Create a new Express account — Stripe detects seller's country during onboarding
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Release only when buyer confirms
          },
        },
      },
      metadata: { user_email: user.email },
    });
    stripeAccountId = stripeAccount.id;

    if (account) {
      await base44.entities.SellerPayoutAccount.update(account.id, {
        stripe_account_id: stripeAccountId,
        onboarding_complete: false,
        payouts_enabled: false,
      });
    } else {
      account = await base44.entities.SellerPayoutAccount.create({
        user_email: user.email,
        stripe_account_id: stripeAccountId,
        onboarding_complete: false,
        payouts_enabled: false,
      });
    }
  }

  // Check current status
  const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
  const payoutsEnabled = stripeAccount.payouts_enabled;
  const detailsSubmitted = stripeAccount.details_submitted;

  // Update DB with latest status
  await base44.entities.SellerPayoutAccount.update(account.id, {
    payouts_enabled: payoutsEnabled,
    onboarding_complete: detailsSubmitted,
  });

  if (payoutsEnabled && detailsSubmitted) {
    return Response.json({ already_onboarded: true, payouts_enabled: true });
  }

  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/seller-dashboard?connect=refresh`,
    return_url: `${origin}/seller-dashboard?connect=success`,
    type: 'account_onboarding',
  });

  return Response.json({ url: accountLink.url });
});