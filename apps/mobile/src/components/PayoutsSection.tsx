import { createPayoutOnboardingLink, getPayoutStatus } from "@reef-market/shared";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

export function PayoutsSection() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPayoutStatus(apiClient)
      .then((status) => {
        setConnected(status.connected);
        setPayoutsEnabled(status.payoutsEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function connect() {
    setRedirecting(true);
    setError(null);
    try {
      const { url } = await createPayoutOnboardingLink(apiClient);
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Stripe onboarding");
    } finally {
      setRedirecting(false);
    }
  }

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
      <Pressable onPress={connect} disabled={redirecting} className="mt-3 self-start bg-foreground rounded-xl px-4 py-2.5">
        {redirecting ? (
          <ActivityIndicator color={themeColors.white} />
        ) : (
          <Text className="text-sm font-semibold text-white">{payoutsEnabled ? "Manage Stripe Account" : "Connect Stripe"}</Text>
        )}
      </Pressable>
    </View>
  );
}
