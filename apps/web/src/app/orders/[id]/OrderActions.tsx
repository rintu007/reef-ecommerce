"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelOrder,
  confirmPickup,
  confirmReceipt,
  denyDoaClaim,
  denyPickup,
  fileDoaClaim,
  markPickedUp,
  refundOrder,
  shipOrder,
  type Order,
} from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const DOA_ELIGIBLE_STATUSES = ["confirmed", "shipped", "delivered", "awaiting_pickup", "pickup_confirmed", "completed"];

const BTN_PRIMARY = "px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50";
const BTN_DANGER = "px-4 py-2 rounded-lg bg-red-100 text-red-800 text-sm font-semibold hover:bg-red-200 transition-colors disabled:opacity-50";
const BTN_SECONDARY = "px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50";

export function OrderActions({ order, role }: { order: Order; role: "buyer" | "seller" | "admin" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimReason, setClaimReason] = useState("");

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const claimEligible = role === "buyer" && DOA_ELIGIBLE_STATUSES.includes(order.status);

  const hasAnyAction =
    (role === "buyer" &&
      (order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "shipped" ||
        order.status === "awaiting_pickup" ||
        claimEligible)) ||
    (role === "seller" && order.status === "confirmed") ||
    (role === "admin" && !!order.payment_intent_id && order.status !== "doa_claim" && order.status !== "cancelled") ||
    (role === "admin" && !!order.doa_claim_status);

  if (!hasAnyAction) return null;

  return (
    <div className="pt-3 border-t border-gray-200 space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {role === "buyer" && order.status === "pending" && (
        <button onClick={() => run(() => cancelOrder(apiClient, order.id))} disabled={busy} className={BTN_DANGER}>
          Cancel Order
        </button>
      )}

      {role === "buyer" && (order.status === "confirmed" || order.status === "shipped") && (
        <button onClick={() => run(() => confirmReceipt(apiClient, order.id))} disabled={busy} className={BTN_PRIMARY}>
          Confirm Receipt
        </button>
      )}

      {role === "buyer" && order.status === "awaiting_pickup" && (
        <div className="flex gap-2">
          <button onClick={() => run(() => confirmPickup(apiClient, order.id))} disabled={busy} className={BTN_PRIMARY}>
            Confirm Pickup
          </button>
          <button onClick={() => run(() => denyPickup(apiClient, order.id))} disabled={busy} className={BTN_DANGER}>
            I Didn&apos;t Pick This Up
          </button>
        </div>
      )}

      {role === "seller" && order.status === "confirmed" && order.shipping_method === "shipping" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => shipOrder(apiClient, order.id, { tracking_number: trackingNumber, carrier: carrier || undefined }));
          }}
          className="space-y-2"
        >
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Carrier (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>
            Mark Shipped
          </button>
        </form>
      )}

      {role === "seller" && order.status === "confirmed" && order.shipping_method === "local_pickup" && (
        <button onClick={() => run(() => markPickedUp(apiClient, order.id))} disabled={busy} className={BTN_PRIMARY}>
          Mark Picked Up
        </button>
      )}

      {role === "admin" && order.payment_intent_id && order.status !== "doa_claim" && order.status !== "cancelled" && (
        <div className="flex gap-2">
          <button onClick={() => run(() => refundOrder(apiClient, order.id, "refund"))} disabled={busy} className={BTN_DANGER}>
            Refund via Stripe
          </button>
          <button
            onClick={() => run(() => refundOrder(apiClient, order.id, "store_credit"))}
            disabled={busy}
            className={BTN_SECONDARY}
          >
            Issue Store Credit
          </button>
        </div>
      )}

      {role === "admin" && order.doa_claim_status && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
          <p className="font-semibold text-amber-900">
            DOA claim: <span className="capitalize">{order.doa_claim_status}</span>
          </p>
          {order.doa_claim_reason && <p className="text-amber-800 mt-1">{order.doa_claim_reason}</p>}
          {order.doa_claim_status === "pending" && (
            <button onClick={() => run(() => denyDoaClaim(apiClient, order.id))} disabled={busy} className={`${BTN_SECONDARY} mt-2`}>
              Deny Claim
            </button>
          )}
        </div>
      )}

      {claimEligible && order.doa_claim_status === "pending" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
          <p className="font-semibold text-amber-900">Claim under review</p>
          <p className="text-amber-800 mt-1">{order.doa_claim_reason}</p>
        </div>
      )}

      {claimEligible && order.doa_claim_status !== "pending" && !showClaimForm && (
        <button onClick={() => setShowClaimForm(true)} className={BTN_DANGER}>
          {order.doa_claim_status === "denied" ? "File a New Claim" : "File a Claim"}
        </button>
      )}

      {claimEligible && order.doa_claim_status !== "pending" && showClaimForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => fileDoaClaim(apiClient, order.id, { reason: claimReason })).then(() => setShowClaimForm(false));
          }}
          className="space-y-2"
        >
          <textarea
            value={claimReason}
            onChange={(e) => setClaimReason(e.target.value)}
            placeholder="What happened? (e.g. arrived dead, photo taken within 2 hours)"
            required
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={busy} className={BTN_DANGER}>
            Submit Claim
          </button>
        </form>
      )}
    </div>
  );
}
