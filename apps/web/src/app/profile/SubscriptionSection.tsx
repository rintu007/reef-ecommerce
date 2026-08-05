"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelSubscription, createSubscriptionCheckout, getOwnSubscription, listMembershipPlans, type MembershipPlan, type UserSubscription } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

export function SubscriptionSection() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [plansRes, subRes] = await Promise.all([listMembershipPlans(apiClient), getOwnSubscription(apiClient)]);
    setPlans(plansRes.plans);
    setSubscription(subRes.subscription);
    setCurrentPlan(subRes.plan);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function upgrade(slug: "pro" | "business") {
    setRedirecting(slug);
    setError(null);
    try {
      const { url } = await createSubscriptionCheckout(apiClient, slug);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout");
      setRedirecting(null);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of the current billing period.")) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelSubscription(apiClient);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return null;

  const isPaid = currentPlan && currentPlan.slug !== "free";

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <p className="font-semibold text-sm">Membership</p>
      <p className="text-sm text-gray-500 mt-1">
        Current plan: <span className="font-semibold text-gray-900">{currentPlan?.name}</span>
        {isPaid && subscription?.current_period_end && ` · renews ${subscription.current_period_end}`}
      </p>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        {plans
          .filter((p) => p.slug !== "free")
          .map((plan) => (
            <div key={plan.id} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="text-xs text-gray-500">${plan.price_monthly.toFixed(2)}/mo</p>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {currentPlan?.slug === plan.slug ? (
                <span className="mt-2 inline-block text-xs font-semibold text-emerald-600">Current plan</span>
              ) : (
                <button
                  onClick={() => upgrade(plan.slug as "pro" | "business")}
                  disabled={redirecting !== null}
                  className="mt-2 w-full rounded-lg bg-blue-600 text-white text-xs font-semibold py-1.5 hover:bg-blue-700 disabled:opacity-50"
                >
                  {redirecting === plan.slug ? "Redirecting…" : "Upgrade"}
                </button>
              )}
            </div>
          ))}
      </div>

      {isPaid && (
        <button onClick={cancel} disabled={cancelling} className="mt-3 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
          {cancelling ? "Cancelling…" : "Cancel Subscription"}
        </button>
      )}
    </div>
  );
}
