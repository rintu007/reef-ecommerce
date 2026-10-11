import { getSellerEarnings, type SellerEarningsSummary } from "@reef-market/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-lg font-bold text-foreground">{value}</Text>
    </View>
  );
}

/**
 * Previously there was no way to answer "how much have I earned, and when
 * do I get paid?" anywhere in the app — a seller who'd actually sold
 * something had zero visibility into it. stripeAvailable/stripePending come
 * straight from Stripe's own balance for the connected account; this app
 * never holds funds itself, so there's no app-side "wallet" balance to
 * show beyond what Stripe already reports — Express accounts pay out
 * automatically on their own schedule (typically daily), not on withdraw-
 * on-demand, so this is "what Stripe will pay out", not a withdraw button.
 */
export function EarningsSection() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SellerEarningsSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSellerEarnings(apiClient)
        .then(setSummary)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View className="rounded-xl border border-border bg-card p-4 items-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  if (!summary || (!summary.payoutsEnabled && summary.lifetimeEarned === 0 && !summary.lastSold && !summary.lastBought)) {
    return null;
  }

  return (
    <View className="rounded-xl border border-border bg-card p-4 gap-4">
      <Text className="font-semibold text-sm text-foreground">Earnings</Text>

      <View className="flex-row">
        <Stat label="Lifetime earned" value={`$${summary.lifetimeEarned.toFixed(2)}`} />
        {summary.payoutsEnabled && (
          <>
            <Stat label="Available to pay out" value={`$${summary.stripeAvailable.toFixed(2)}`} />
            <Stat label="Pending (clearing)" value={`$${summary.stripePending.toFixed(2)}`} />
          </>
        )}
      </View>

      {summary.payoutsEnabled && (
        <Text className="text-xs text-muted-foreground -mt-2">
          Stripe pays out available funds to your bank automatically on its own schedule — there&apos;s nothing to
          manually withdraw.
        </Text>
      )}

      {(summary.lastSold || summary.lastBought) && (
        <View className="gap-2 border-t border-border pt-3">
          {summary.lastSold && (
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-muted-foreground flex-1 pr-2" numberOfLines={1}>
                Last sold: {summary.lastSold.listingTitle}
              </Text>
              <Text className="text-xs font-semibold text-foreground">${summary.lastSold.amount.toFixed(2)}</Text>
            </View>
          )}
          {summary.lastBought && (
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-muted-foreground flex-1 pr-2" numberOfLines={1}>
                Last bought: {summary.lastBought.listingTitle}
              </Text>
              <Text className="text-xs font-semibold text-foreground">${summary.lastBought.amount.toFixed(2)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
