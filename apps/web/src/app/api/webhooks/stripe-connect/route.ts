import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/server/env";
import { stripe } from "@/lib/server/stripe";
import { syncPayoutAccountStatus } from "@/lib/server/payouts";

/**
 * Separate endpoint from api/webhooks/stripe — Stripe Connect account
 * events (account.updated for a connected Express account) only deliver to
 * a dedicated "Connect" webhook endpoint, not the platform's own one, even
 * if the platform endpoint has account.updated in its enabled_events list.
 * Confirmed by checking the connected account's own event log directly
 * (Stripe-Account header): the events were firing correctly on Stripe's
 * side the whole time, they just had nowhere configured to deliver to —
 * seller_payout_accounts.payouts_enabled silently stayed stale forever
 * after onboarding, regardless of how many times a seller completed it.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, env.stripeConnectWebhookSecret);
  } catch (err) {
    console.error("Stripe Connect webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      await syncPayoutAccountStatus(account.id, !!account.payouts_enabled, !!account.details_submitted);
    }
  } catch (error) {
    console.error("Stripe Connect webhook handler error", event.type, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
