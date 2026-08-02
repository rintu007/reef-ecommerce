/**
 * Client-safe fee PREVIEW math — mirrors the authoritative implementation in
 * apps/web/lib/server/fees.ts (built in a later step), which is the only copy
 * that actually determines what gets charged. This copy exists purely so the
 * UI can show an instant estimate before hitting the API; never trust it for
 * money movement.
 *
 * Source of truth for these constants: SYSTEM_ANALYSIS.md §3.3 (the real,
 * observed createPaymentIntent behavior in the current Base44 app). Per the
 * rebuild plan's bug-fix #5, this is now defined in exactly one place instead
 * of being duplicated with drift across four Base44 functions.
 */

import type { ShippingTier } from "./types/entities";

export const PLATFORM_FEE_RATE = 0.05; // 5% of item subtotal, platform's cut
export const FEATURED_FEE_CENTS = 99; // flat $0.99 add-on fee for featured listings
export const STRIPE_FEE_RATE = 0.029; // 2.9%
export const STRIPE_FEE_FIXED_CENTS = 30; // + $0.30

/** Dollars -> integer cents, half-up. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Resolves shipping cost for a given quantity: first tier whose `up_to_qty`
 * covers the quantity, else the last (highest) tier covers everything above
 * it. Falls back to the listing's flat `shippingCost` when there are no tiers.
 */
export function computeShippingCents(
  tiers: ShippingTier[] | null | undefined,
  flatShippingCost: number,
  quantity: number
): number {
  if (!tiers || tiers.length === 0) {
    return toCents(flatShippingCost || 0);
  }
  const sorted = [...tiers].sort((a, b) => a.up_to_qty - b.up_to_qty);
  const match = sorted.find((tier) => quantity <= tier.up_to_qty);
  const tier = match ?? sorted[sorted.length - 1];
  return toCents(tier.price);
}

export function computePlatformFeeCents(itemSubtotalCents: number): number {
  return Math.round(itemSubtotalCents * PLATFORM_FEE_RATE);
}

export function computeStripeFeeEstimateCents(totalChargedCents: number): number {
  return Math.round(totalChargedCents * STRIPE_FEE_RATE) + STRIPE_FEE_FIXED_CENTS;
}

export interface CheckoutBreakdown {
  itemSubtotalCents: number;
  shippingCents: number;
  totalChargedCents: number;
  platformFeeCents: number;
  featuredFeeCents: number;
  stripeFeeEstimateCents: number;
  /** Estimate only — actual payout is determined server-side via Stripe Connect. */
  sellerReceivesEstimateCents: number;
}

export function computeCheckoutBreakdown(params: {
  price: number;
  quantity: number;
  shippingMethod: "shipping" | "local_pickup";
  shippingTiers?: ShippingTier[] | null;
  flatShippingCost?: number;
  pickupPrice?: number | null;
  featured: boolean;
}): CheckoutBreakdown {
  const { price, quantity, shippingMethod, shippingTiers, flatShippingCost, pickupPrice, featured } = params;

  const unitPrice = shippingMethod === "local_pickup" && pickupPrice != null ? pickupPrice : price;
  const itemSubtotalCents = toCents(unitPrice) * quantity;
  const shippingCents =
    shippingMethod === "shipping" ? computeShippingCents(shippingTiers, flatShippingCost ?? 0, quantity) : 0;
  const totalChargedCents = itemSubtotalCents + shippingCents;

  const platformFeeCents = computePlatformFeeCents(itemSubtotalCents);
  const featuredFeeCents = featured ? FEATURED_FEE_CENTS : 0;
  const stripeFeeEstimateCents = computeStripeFeeEstimateCents(totalChargedCents);
  const sellerReceivesEstimateCents =
    itemSubtotalCents - platformFeeCents - stripeFeeEstimateCents - featuredFeeCents;

  return {
    itemSubtotalCents,
    shippingCents,
    totalChargedCents,
    platformFeeCents,
    featuredFeeCents,
    stripeFeeEstimateCents,
    sellerReceivesEstimateCents,
  };
}
