import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { PayoutStatusState } from "@/lib/use-payout-status";
import { themeColors } from "@/lib/theme-colors";

/** Status is owned by the profile screen (one fetch, shared with the completion meter) rather than fetched again in here. */
export function PayoutsSection({ status }: { status: PayoutStatusState }) {
  const { loading, connecting, connected, payoutsEnabled, error, connect } = status;

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
            ? "Stripe setup started but isn't finished yet — payouts are off until it's complete."
            : "Connect Stripe to receive money when your listings sell."}
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
