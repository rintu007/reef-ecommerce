import {
  computeCheckoutBreakdown,
  computePlatformFeeCents,
  fromCents,
  toCents,
  type CartCheckoutItemResult,
  type CheckoutInput,
  type FileDoaClaimInput,
  type Order,
  type ShipOrderInput,
} from "@reef-market/shared";
import type { AuthUser } from "./auth";
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabase-admin";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

/**
 * Creates the Order row up front (status "pending", before any charge
 * succeeds) rather than only after payment, matching the schema's own intent
 * — orders_no_duplicate_active_idx blocks a second pending/confirmed order
 * for the same listing+buyer, which only makes sense if "pending" orders are
 * real rows. The Stripe PaymentIntent uses transfer_data.destination (single
 * direct-charge model — the payout decision made for this rebuild), so the
 * seller is paid at charge-success time; there is no separate "release
 * payment" step anywhere in this file.
 */
export async function createCheckoutIntent(
  buyerId: string,
  input: CheckoutInput
): Promise<{ order: Order; clientSecret: string | null }> {
  const db = supabaseAdmin();

  const { data: listing, error: listingError } = await db
    .from("listings")
    .select("*")
    .eq("id", input.listing_id)
    .maybeSingle();
  if (listingError) throw listingError;
  if (!listing) throw new OrderError("Listing not found", 404);
  if (listing.seller_id === buyerId) throw new OrderError("You can't buy your own listing", 400);
  if (listing.status !== "active") throw new OrderError("This listing is no longer available", 400);
  if (input.quantity < listing.min_qty) throw new OrderError(`Minimum quantity is ${listing.min_qty}`, 400);
  if (input.quantity > listing.quantity) throw new OrderError("Not enough quantity available", 400);
  if (input.shipping_method === "shipping" && !listing.shipping_available) {
    throw new OrderError("This listing doesn't offer shipping", 400);
  }
  if (input.shipping_method === "local_pickup" && !listing.local_pickup) {
    throw new OrderError("This listing doesn't offer local pickup", 400);
  }

  const breakdown = computeCheckoutBreakdown({
    price: listing.price,
    quantity: input.quantity,
    shippingMethod: input.shipping_method,
    shippingTiers: listing.shipping_tiers,
    flatShippingCost: listing.shipping_cost,
    pickupPrice: listing.pickup_price,
    featured: listing.featured_fee,
  });

  if (fromCents(breakdown.totalChargedCents) < listing.min_order_amount) {
    throw new OrderError(`Order must be at least $${listing.min_order_amount.toFixed(2)}`, 400);
  }

  const { data: payoutAccount } = await db
    .from("seller_payout_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("user_id", listing.seller_id)
    .maybeSingle();
  if (!payoutAccount?.stripe_account_id || !payoutAccount.payouts_enabled) {
    throw new OrderError("This seller hasn't finished payment setup yet", 400);
  }

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      listing_id: listing.id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      listing_title: listing.title,
      listing_photo: listing.photos[0] ?? null,
      price: listing.price,
      total_charged: fromCents(breakdown.totalChargedCents),
      quantity: input.quantity,
      shipping_method: input.shipping_method,
      status: "pending",
      buyer_protection: true,
      pickup_address: input.shipping_method === "local_pickup" ? listing.pickup_address : null,
      pickup_time: input.pickup_time ?? null,
    })
    .select()
    .single();
  if (orderError) {
    if (orderError.code === "23505") {
      throw new OrderError("You already have an order in progress for this listing", 409);
    }
    throw orderError;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe().paymentIntents.create({
      amount: breakdown.totalChargedCents,
      currency: listing.currency.toLowerCase(),
      application_fee_amount: breakdown.platformFeeCents + breakdown.featuredFeeCents,
      transfer_data: { destination: payoutAccount.stripe_account_id },
      metadata: { order_id: order.id, listing_id: listing.id, buyer_id: buyerId, seller_id: listing.seller_id },
    });
  } catch (stripeError) {
    // The order row above is already committed — if PaymentIntent creation
    // fails (e.g. seller's Connect account not fully verified yet), don't
    // leave it stuck in "pending" forever with no payment_intent_id for a
    // webhook to ever resolve. Delete it outright rather than "cancelled",
    // since a buyer never even saw a payment screen for it.
    await db.from("orders").delete().eq("id", order.id);
    throw stripeError;
  }

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ payment_intent_id: paymentIntent.id })
    .eq("id", order.id)
    .select()
    .single();
  if (updateError) throw updateError;

  return { order: updated as Order, clientSecret: paymentIntent.client_secret };
}

/**
 * Cart checkout: no new payment architecture — a cart is a client-side
 * convenience for queuing multiple single-listing purchases (across one or
 * more sellers), and each line item still becomes its own Order + PaymentIntent
 * via the exact same createCheckoutIntent() path a solo "Buy Now" uses. A
 * single Stripe PaymentIntent only has one transfer_data.destination, so
 * merging items into one charge isn't an option without a different
 * settlement model; this keeps every existing order/webhook/refund code path
 * unchanged and reuses it N times instead. One item failing (e.g. sold out)
 * doesn't block the others — each result is reported independently so the
 * client can walk through payment confirmation one at a time and surface
 * per-item failures.
 */
export async function checkoutCart(buyerId: string, items: CheckoutInput[]): Promise<CartCheckoutItemResult[]> {
  const results: CartCheckoutItemResult[] = [];
  for (const item of items) {
    try {
      const { order, clientSecret } = await createCheckoutIntent(buyerId, item);
      results.push({ listing_id: item.listing_id, order, clientSecret, error: null });
    } catch (err) {
      results.push({
        listing_id: item.listing_id,
        order: null,
        clientSecret: null,
        error: err instanceof OrderError ? err.message : "Checkout failed for this item",
      });
    }
  }
  return results;
}

/**
 * Authoritative order finalization, called from the Stripe webhook
 * (payment_intent.succeeded). Idempotent: a no-op if the order isn't still
 * "pending" (already confirmed by an earlier delivery of the same event, or
 * unknown order), matching Stripe's at-least-once webhook delivery.
 */
export async function confirmOrderPayment(paymentIntentId: string): Promise<void> {
  const db = supabaseAdmin();
  const { data: order, error } = await db
    .from("orders")
    .select("id, listing_id, quantity, status")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (error) throw error;
  if (!order || order.status !== "pending") return;

  await db.from("orders").update({ status: "confirmed" }).eq("id", order.id);
  await db.rpc("decrement_listing_quantity", { p_listing_id: order.listing_id, p_amount: order.quantity });
}

/** payment_intent.payment_failed / .canceled — frees the listing back up for another attempt. */
export async function cancelOrderByPaymentIntent(paymentIntentId: string): Promise<void> {
  const db = supabaseAdmin();
  await db.from("orders").update({ status: "cancelled" }).eq("payment_intent_id", paymentIntentId).eq("status", "pending");
}

export async function cancelOrder(orderId: string, buyerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (order.status !== "pending") throw new OrderError("Only pending orders can be cancelled", 400);

  if (order.payment_intent_id) {
    await stripe()
      .paymentIntents.cancel(order.payment_intent_id)
      .catch(() => {
        // already succeeded/cancelled on Stripe's side — the DB status change below is authoritative either way
      });
  }

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

export async function deleteOrder(orderId: string, buyerId: string): Promise<void> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("id, buyer_id, status").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (order.status !== "cancelled") throw new OrderError("Only cancelled orders can be deleted", 400);

  const { error: deleteError } = await db.from("orders").delete().eq("id", orderId);
  if (deleteError) throw deleteError;
}

async function completeOrder(orderId: string, sellerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  await db.rpc("increment_completed_sales", { p_seller_id: sellerId });
  return updated as Order;
}

/**
 * Verified-coral-seller perk (SYSTEM_ANALYSIS.md SS3.5): adding tracking on a
 * coral listing from a verified seller completes the order immediately
 * instead of waiting on the shipped/delivered/confirm-receipt sequence. In
 * the simplified single-direct-charge payout model this perk is purely a
 * status fast-track — the seller was already paid at checkout, there's no
 * separate fund release tied to it.
 */
export async function markShipped(orderId: string, sellerId: string, input: ShipOrderInput): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.seller_id !== sellerId) throw new OrderError("Order not found", 404);
  if (order.status !== "confirmed") throw new OrderError("Order isn't awaiting shipment", 400);
  if (order.shipping_method !== "shipping") throw new OrderError("This order isn't a shipping order", 400);

  const [{ data: listing }, { data: seller }] = await Promise.all([
    db.from("listings").select("listing_type").eq("id", order.listing_id).maybeSingle(),
    db.from("profiles").select("verified_seller").eq("id", sellerId).single(),
  ]);

  const { error: updateError } = await db
    .from("orders")
    .update({ tracking_number: input.tracking_number, carrier: input.carrier ?? null, status: "shipped" })
    .eq("id", orderId);
  if (updateError) throw updateError;

  if (listing?.listing_type === "coral" && seller?.verified_seller) {
    return completeOrder(orderId, sellerId);
  }

  const { data: updated, error: reloadError } = await db.from("orders").select("*").eq("id", orderId).single();
  if (reloadError) throw reloadError;
  return updated as Order;
}

export async function confirmReceipt(orderId: string, buyerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (!["confirmed", "shipped"].includes(order.status)) {
    throw new OrderError("Order isn't ready to be marked received", 400);
  }
  return completeOrder(orderId, order.seller_id);
}

export async function markPickedUp(orderId: string, sellerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.seller_id !== sellerId) throw new OrderError("Order not found", 404);
  if (order.status !== "confirmed") throw new OrderError("Order isn't awaiting pickup", 400);
  if (order.shipping_method !== "local_pickup") throw new OrderError("This order isn't a pickup order", 400);

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ status: "awaiting_pickup", seller_marked_picked_up: true, seller_marked_picked_up_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

export async function confirmPickup(orderId: string, buyerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (order.status !== "awaiting_pickup") throw new OrderError("Order isn't awaiting pickup confirmation", 400);

  await db.from("orders").update({ buyer_confirmed_pickup: true }).eq("id", orderId);
  return completeOrder(orderId, order.seller_id);
}

/** Dispute branch: buyer says the seller's pickup claim is wrong — reverts to "confirmed", no transfer happens. */
export async function denyPickup(orderId: string, buyerId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (order.status !== "awaiting_pickup") throw new OrderError("Order isn't awaiting pickup confirmation", 400);

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ status: "confirmed", seller_marked_picked_up: false, seller_marked_picked_up_at: null })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

/**
 * Buyer files a DOA (dead-on-arrival) claim. Doesn't touch order.status —
 * `doa_claim_status` is a separate review lane so this can't collide with
 * `status: "doa_claim"`, which refundOrder() sets only once a claim is
 * actually resolved via refund. Re-filing after a denial is allowed (updates
 * the same row); filing while a claim is already pending is not.
 */
export async function fileDoaClaim(orderId: string, buyerId: string, input: FileDoaClaimInput): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.buyer_id !== buyerId) throw new OrderError("Order not found", 404);
  if (!["confirmed", "shipped", "delivered", "awaiting_pickup", "pickup_confirmed", "completed"].includes(order.status)) {
    throw new OrderError("This order isn't eligible for a claim", 400);
  }
  if (order.doa_claim_status === "pending") throw new OrderError("A claim is already pending review for this order", 400);

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({
      doa_claim_status: "pending",
      doa_claim_reason: input.reason,
      doa_claim_photos: input.photos ?? [],
      doa_claim_filed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

/** Admin denies a pending DOA claim without refunding — order.status is untouched. */
export async function denyDoaClaim(orderId: string): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("doa_claim_status").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.doa_claim_status !== "pending") throw new OrderError("No pending claim on this order", 400);

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ doa_claim_status: "denied" })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

/**
 * 72h auto-release safety net (SYSTEM_ANALYSIS.md SS3.5) — meant to run from a
 * scheduled job (see api/cron/release-pending-pickups).
 */
export async function releaseStalePendingPickups(hoursThreshold = 72): Promise<number> {
  const db = supabaseAdmin();
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();
  const { data: stale, error } = await db
    .from("orders")
    .select("id, seller_id")
    .eq("status", "awaiting_pickup")
    .lt("seller_marked_picked_up_at", cutoff);
  if (error) throw error;

  for (const order of stale ?? []) {
    await completeOrder(order.id, order.seller_id);
  }
  return stale?.length ?? 0;
}

/**
 * Admin-only. `refund` calls Stripe for real (product decision for this
 * rebuild — the legacy `processRefundOrCredit` only flipped status, per a
 * literal TODO in its source; SYSTEM_ANALYSIS.md SS5 flagged that as a gap,
 * not a feature to preserve). Sets the dedicated `refunded` status — this
 * used to reuse `doa_claim`, which made a completed refund indistinguishable
 * from an still-open dispute in every order status display in the app.
 */
export async function refundOrder(orderId: string, adminId: string, mode: "refund" | "store_credit"): Promise<Order> {
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) throw new OrderError("Order not found", 404);
  if (!order.payment_intent_id || !order.total_charged) throw new OrderError("Order has no payment to refund", 400);

  const nonRefundablePlatformFeeCents = computePlatformFeeCents(toCents(order.price) * order.quantity);
  const refundableCents = toCents(order.total_charged) - nonRefundablePlatformFeeCents;
  if (refundableCents <= 0) throw new OrderError("Nothing refundable on this order", 400);

  if (mode === "refund") {
    await stripe().refunds.create({ payment_intent: order.payment_intent_id, amount: refundableCents });
  } else {
    const { error: creditError } = await db.from("user_credits").insert({
      user_id: order.buyer_id,
      amount: fromCents(refundableCents),
      reason: `Store credit for order ${order.id}`,
      order_id: order.id,
      issued_by: adminId,
      status: "available",
    });
    if (creditError) throw creditError;
  }

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({ status: "refunded", ...(order.doa_claim_status === "pending" ? { doa_claim_status: "approved" } : {}) })
    .eq("id", orderId)
    .select()
    .single();
  if (updateError) throw updateError;
  return updated as Order;
}

export async function listOrdersForUser(userId: string, role: "buyer" | "seller"): Promise<Order[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq(role === "buyer" ? "buyer_id" : "seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function listAllOrders(limit = 100): Promise<Order[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getOrderById(id: string, viewer: AuthUser): Promise<Order | null> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (viewer.role !== "admin" && data.buyer_id !== viewer.id && data.seller_id !== viewer.id) return null;
  return data as Order;
}
