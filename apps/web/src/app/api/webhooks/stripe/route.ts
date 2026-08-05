import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/server/env";
import { stripe } from "@/lib/server/stripe";
import { cancelOrderByPaymentIntent, confirmOrderPayment } from "@/lib/server/orders";
import { syncPayoutAccountStatus } from "@/lib/server/payouts";
import { syncSubscriptionFromCheckoutSession, syncSubscriptionFromStripeObject } from "@/lib/server/subscriptions";

/**
 * Authoritative order-finalization path (SYSTEM_ANALYSIS.md SS3.3: the webhook
 * is "the authoritative fallback" even when a client-side confirmation call
 * also exists) — this rebuild only has the webhook path, no client-side
 * optimistic order-creation call, since the order row is already created
 * up front at checkout time (see orders.ts).
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await confirmOrderPayment(intent.id);
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await cancelOrderByPaymentIntent(intent.id);
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await syncPayoutAccountStatus(account.id, !!account.payouts_enabled, !!account.details_submitted);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") await syncSubscriptionFromCheckoutSession(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeObject(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error", event.type, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
