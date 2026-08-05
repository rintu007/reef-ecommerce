import type { MembershipPlan, PlanSlug, SubscriptionStatus, UserSubscription } from "@reef-market/shared";
import type Stripe from "stripe";
import { env } from "./env";
import { AppError } from "./http";
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabase-admin";

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("membership_plans").select("*").eq("is_active", true).order("price_monthly", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MembershipPlan[];
}

export interface OwnSubscriptionResult {
  subscription: UserSubscription | null;
  plan: MembershipPlan;
}

export async function getOwnSubscription(userId: string): Promise<OwnSubscriptionResult> {
  const db = supabaseAdmin();
  const { data: subscription, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (error) throw error;

  const planSlug = subscription?.plan_slug ?? "free";
  const { data: plan, error: planError } = await db.from("membership_plans").select("*").eq("slug", planSlug).single();
  if (planError) throw planError;

  return { subscription: (subscription as UserSubscription | null) ?? null, plan: plan as MembershipPlan };
}

/**
 * Inline price_data (no pre-created Stripe Price objects) — this app has no
 * existing Stripe Subscriptions precedent, so plan price/name come straight
 * from membership_plans rather than requiring the two to be kept in sync.
 */
export async function createSubscriptionCheckoutSession(userId: string, email: string, planSlug: PlanSlug): Promise<string> {
  if (planSlug === "free") throw new AppError("Cannot check out for the free plan");

  const db = supabaseAdmin();
  const { data: plan, error: planError } = await db.from("membership_plans").select("*").eq("slug", planSlug).eq("is_active", true).maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new AppError("Unknown plan");

  const { data: existingCustomerRow } = await db
    .from("user_subscriptions")
    .select("external_customer_id")
    .eq("user_id", userId)
    .not("external_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  let customerId = existingCustomerRow?.external_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe().customers.create({ email, metadata: { userId } });
    customerId = customer.id;
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Reef Market — ${plan.name}` },
          unit_amount: Math.round(plan.price_monthly * 100),
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${env.appUrl}/profile?subscription=success`,
    cancel_url: `${env.appUrl}/profile?subscription=cancelled`,
    metadata: { userId, planSlug },
    subscription_data: { metadata: { userId, planSlug } },
  });
  if (!session.url) throw new AppError("Failed to start checkout", 500);
  return session.url;
}

export async function cancelOwnSubscription(userId: string): Promise<UserSubscription> {
  const db = supabaseAdmin();
  const { data: subscription, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (error) throw error;
  if (!subscription) throw new AppError("No active subscription to cancel");

  if (subscription.payment_provider === "stripe" && subscription.external_subscription_id) {
    await stripe().subscriptions.update(subscription.external_subscription_id, { cancel_at_period_end: true });
    return subscription as UserSubscription;
  }

  const { data: updated, error: updateError } = await db
    .from("user_subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscription.id)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as UserSubscription;
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "active":
      return "active";
    default:
      return "cancelled";
  }
}

/** checkout.session.completed (subscription mode) — creates the first user_subscriptions row from Stripe's data. */
export async function syncSubscriptionFromCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const planSlug = session.metadata?.planSlug as PlanSlug | undefined;
  if (!userId || !planSlug || !session.subscription || !session.customer) return;

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);

  await upsertSubscriptionRow(userId, {
    plan_slug: planSlug,
    status: mapStripeStatus(subscription.status),
    current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString().slice(0, 10),
    current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString().slice(0, 10),
    payment_provider: "stripe",
    external_subscription_id: subscription.id,
    external_customer_id: customerId,
  });
}

/** customer.subscription.updated/deleted — keeps status/period in sync with Stripe as the source of truth. */
export async function syncSubscriptionFromStripeObject(subscription: Stripe.Subscription): Promise<void> {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id, user_id, plan_slug")
    .eq("external_subscription_id", subscription.id)
    .maybeSingle();
  if (!existing) return;

  await db
    .from("user_subscriptions")
    .update({
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString().slice(0, 10),
      current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString().slice(0, 10),
    })
    .eq("id", existing.id);
}

async function upsertSubscriptionRow(
  userId: string,
  row: {
    plan_slug: PlanSlug;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    payment_provider: "stripe";
    external_subscription_id: string;
    external_customer_id: string;
  }
): Promise<void> {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (existing) {
    const { error } = await db.from("user_subscriptions").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("user_subscriptions").insert({ ...row, user_id: userId });
    if (error) throw error;
  }
}
