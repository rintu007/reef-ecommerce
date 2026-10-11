import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { usePayoutStatus } from "@/lib/use-payout-status";
import { themeColors } from "@/lib/theme-colors";

export function PayoutsSection() {
  const { loading, connecting, connected, payoutsEnabled, error, refresh, connect } = usePayoutStatus();

  // Refetch whenever this screen regains focus, not just once on mount —
  // the most common way status actually changes is the user going to
  // Stripe's onboarding in a browser and coming back, which re-focuses
  // this screen without necessarily remounting it.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading) {
    return (
      <View className="rounded-xl border border-border bg-card p-4 items-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold text-sm text-foreground">Seller Payouts</Text>
      <Text className="text-sm text-muted-foreground mt-1">
        {payoutsEnabled
          ? "Stripe is connected — you can receive payments for sales."
          : connected
            ? "Stripe onboarding started but isn't finished yet — payouts are disabled until it's complete."
            : "Connect a Stripe account to receive payments when your listings sell."}
      </Text>
      {error && <Text className="text-sm text-destructive mt-2">{error}</Text>}
      <Pressable onPress={connect} disabled={connecting} className="mt-3 self-start bg-foreground rounded-xl px-4 py-2.5">
        {connecting ? (
          <ActivityIndicator color={themeColors.white} />
        ) : (
          <Text className="text-sm font-semibold text-white">{payoutsEnabled ? "Manage Stripe Account" : "Connect Stripe"}</Text>
        )}
      </Pressable>
    </View>
  );
}
