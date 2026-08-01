/**
 * createCartPaymentIntent
 * Creates a single Stripe PaymentIntent for multiple listings from the same seller.
 * All items must belong to the same seller (enforced server-side).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const PLATFORM_FEE_RATE = 0.05;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { listing_ids, seller_email } = await req.json();

    if (!listing_ids?.length) return Response.json({ error: 'No listing_ids provided' }, { status: 400 });
    if (listing_ids.length > 20) return Response.json({ error: 'Too many items in cart' }, { status: 400 });

    // Fetch all listings
    const listingPromises = listing_ids.map(id =>
      base44.asServiceRole.entities.Listing.filter({ id })
        .then(rows => rows[0])
    );
    const listings = (await Promise.all(listingPromises)).filter(Boolean);

    if (listings.length !== listing_ids.length) {
      return Response.json({ error: 'One or more listings not found' }, { status: 404 });
    }

    // Validate all from same seller
    const uniqueSellers = [...new Set(listings.map(l => l.seller_email))];
    if (uniqueSellers.length !== 1) {
      return Response.json({ error: 'All items must be from the same seller' }, { status: 400 });
    }
    const resolvedSellerEmail = uniqueSellers[0];

    if (resolvedSellerEmail === user.email) {
      return Response.json({ error: 'Cannot buy your own listings' }, { status: 400 });
    }

    // Validate listings are active
    for (const listing of listings) {
      if (listing.status === 'sold') {
        return Response.json({ error: `"${listing.title}" is already sold` }, { status: 400 });
      }
    }

    // Get seller's Stripe account
    const sellerPayoutAccounts = await base44.asServiceRole.entities.SellerPayoutAccount.filter({
      user_email: resolvedSellerEmail,
    });
    const sellerAccount = sellerPayoutAccounts[0];
    if (!sellerAccount?.stripe_account_id || !sellerAccount?.payouts_enabled) {
      return Response.json({ error: 'Seller has not completed payout setup' }, { status: 400 });
    }

    // Use USD for multi-item cart (normalize all prices to USD)
    const currency = 'usd';
    const itemsTotalCents = listings.reduce((sum, l) => sum + Math.round((l.price || 0) * 100), 0);
    const platformFeeCents = Math.round(itemsTotalCents * PLATFORM_FEE_RATE);

    const pi = await stripe.paymentIntents.create({
      amount: itemsTotalCents,
      currency,
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: sellerAccount.stripe_account_id,
      },
      metadata: {
        cart: 'true',
        listing_ids: listing_ids.join(','),
        buyer_email: user.email,
        seller_email: resolvedSellerEmail,
        items_count: String(listings.length),
        items_total_cents: String(itemsTotalCents),
        platform_fee_cents: String(platformFeeCents),
        currency,
      },
    });

    const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || Deno.env.get('VITE_STRIPE_PUBLISHABLE_KEY');

    return Response.json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      publishable_key: STRIPE_PUBLISHABLE_KEY,
      breakdown: {
        items_total: itemsTotalCents / 100,
        platform_fee: platformFeeCents / 100,
        currency,
        listing_ids,
        items: listings.map(l => ({
          id: l.id,
          title: l.title,
          price: l.price,
          photo: l.photos?.[0] || '',
        })),
      },
    });
  } catch (error) {
    console.error('createCartPaymentIntent error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});