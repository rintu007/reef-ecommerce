import type { OrderStatus } from "../types/enums";

export interface OrderStatusMeta {
  label: string;
  /** Short explanation of what this status means / what happens next — shown under the badge. */
  description: string;
  /** Tailwind classes for badge background + text — works as-is in both apps.js (web) and NativeWind (mobile). */
  badgeClassName: string;
}

/**
 * Single source of truth for how order statuses are labeled and colored,
 * used by both apps' order list/detail/admin screens. Replaces the previous
 * `status.replace("_", " ")` pattern used inconsistently in ~6 different
 * places across web + mobile, which showed raw enum values verbatim
 * ("doa claim", "awaiting pickup") with no color, no explanation, and no
 * way to tell a completed refund apart from an active dispute (both used
 * to be the same "doa_claim" status — see the `refunded` migration).
 */
export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: "Pending Payment",
    description: "Waiting for payment to be confirmed.",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    description: "Payment received — the seller is preparing your order.",
    badgeClassName: "bg-blue-100 text-blue-800",
  },
  shipped: {
    label: "Shipped",
    description: "On its way to you.",
    badgeClassName: "bg-blue-100 text-blue-800",
  },
  delivered: {
    label: "Delivered",
    description: "Marked delivered — reach out to the seller if there's an issue.",
    badgeClassName: "bg-emerald-100 text-emerald-800",
  },
  completed: {
    label: "Completed",
    description: "This order is complete.",
    badgeClassName: "bg-emerald-100 text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled and was not charged (or was refunded in full).",
    badgeClassName: "bg-gray-100 text-gray-600",
  },
  doa_claim: {
    label: "Claim Under Review",
    description: "A dead-on-arrival claim is being reviewed by Reef Market.",
    badgeClassName: "bg-red-100 text-red-800",
  },
  awaiting_pickup: {
    label: "Awaiting Pickup",
    description: "Ready — arrange pickup with the seller.",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  pickup_confirmed: {
    label: "Picked Up",
    description: "Pickup confirmed.",
    badgeClassName: "bg-emerald-100 text-emerald-800",
  },
  refunded: {
    label: "Refunded",
    description: "This order was refunded — funds were returned to your original payment method.",
    badgeClassName: "bg-purple-100 text-purple-800",
  },
};
