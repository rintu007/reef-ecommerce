import { cancelSubscription, createSubscriptionCheckout, getOwnSubscription, listMembershipPlans, type MembershipPlan, type UserSubscription } from "@reef-market/shared";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";

export function SubscriptionSection() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

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
    try {
      const { url } = await createSubscriptionCheckout(apiClient, slug);
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Couldn't start checkout");
    } finally {
      setRedirecting(null);
    }
  }

  async function cancel() {
    const confirmed = await confirmAsync("Cancel your subscription?", "You'll keep access until the end of the current billing period.", "Cancel Subscription");
    if (!confirmed) return;
    setCancelling(true);
    try {
      await cancelSubscription(apiClient);
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return null;

  const isPaid = currentPlan && currentPlan.slug !== "free";

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold text-sm text-foreground">Membership</Text>
      <Text className="text-sm text-muted-foreground mt-1">
        Current plan: <Text className="font-semibold text-foreground">{currentPlan?.name}</Text>
        {isPaid && subscription?.current_period_end ? ` · renews ${subscription.current_period_end}` : ""}
      </Text>

      <View className="gap-2 mt-3">
        {plans
          .filter((p) => p.slug !== "free")
          .map((plan) => (
            <View key={plan.id} className="rounded-lg border border-border p-3">
              <Text className="text-sm font-semibold text-foreground">{plan.name}</Text>
              <Text className="text-xs text-muted-foreground">${plan.price_monthly.toFixed(2)}/mo</Text>
              {plan.features.map((f) => (
                <Text key={f} className="text-xs text-muted-foreground mt-0.5">
                  • {f}
                </Text>
              ))}
              {currentPlan?.slug === plan.slug ? (
                <Text className="text-xs font-semibold text-emerald-600 mt-2">Current plan</Text>
              ) : (
                <Pressable
                  onPress={() => upgrade(plan.slug as "pro" | "business")}
                  disabled={redirecting !== null}
                  className="mt-2 bg-primary rounded-lg py-2 items-center"
                >
                  {redirecting === plan.slug ? (
                    <ActivityIndicator color={themeColors.white} />
                  ) : (
                    <Text className="text-xs font-semibold text-white">Upgrade</Text>
                  )}
                </Pressable>
              )}
            </View>
          ))}
      </View>

      {isPaid && (
        <Pressable onPress={cancel} disabled={cancelling} className="mt-3">
          <Text className="text-xs font-semibold text-destructive">{cancelling ? "Cancelling…" : "Cancel Subscription"}</Text>
        </Pressable>
      )}
    </View>
  );
}
