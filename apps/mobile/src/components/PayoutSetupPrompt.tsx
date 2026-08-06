import { createPayoutOnboardingLink } from "@reef-market/shared";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

export function PayoutSetupPrompt({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createPayoutOnboardingLink(apiClient);
      await WebBrowser.openBrowserAsync(url);
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
        <ScrollView className="flex-1 px-5 pt-8" contentContainerClassName="gap-6 pb-6">
          <View className="items-center gap-3">
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
              <Text className="text-3xl">💰</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">Set Up Your Payouts</Text>
            <Text className="text-sm text-muted-foreground text-center px-4">
              Connect a Stripe account so you can receive money when your items sell. This only takes a couple of
              minutes.
            </Text>
          </View>

          <View className="bg-card border border-border rounded-xl p-4 gap-3">
            <View className="flex-row gap-3">
              <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">1</Text>
              </View>
              <Text className="flex-1 text-sm text-muted-foreground">
                <Text className="font-semibold text-foreground">Buyer purchases your item. </Text>
                They pay the listing price + sales tax. You receive 95% of your listing price (Reef Market&apos;s 5%
                fee + processing costs are deducted from your payout).
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">2</Text>
              </View>
              <Text className="flex-1 text-sm text-muted-foreground">
                <Text className="font-semibold text-foreground">Funds held securely. </Text>
                Payment is held by Stripe while the order is in transit or awaiting pickup.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center">
                <Text className="text-xs">→</Text>
              </View>
              <Text className="flex-1 text-sm text-muted-foreground">
                <Text className="font-semibold text-foreground">Payment released to you. </Text>
                Once delivery or pickup is confirmed, your 95% is deposited directly to your bank account via Stripe.
              </Text>
            </View>
          </View>

          <View className="bg-muted rounded-xl p-4 gap-1">
            <Text className="text-xs font-semibold text-muted-foreground uppercase">Example — $100 listing</Text>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Buyer pays</Text>
              <Text className="font-medium text-foreground">$100 + tax + Stripe fee</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Reef Market fee (5%)</Text>
              <Text className="font-medium text-destructive">− $5.00</Text>
            </View>
            <View className="flex-row justify-between border-t border-border pt-2 mt-1">
              <Text className="font-bold text-foreground">You receive</Text>
              <Text className="font-bold text-emerald-600">$95.00</Text>
            </View>
          </View>

          <View className="bg-card border border-border rounded-xl p-4 gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase mb-1">What you&apos;ll need for setup</Text>
            <Text className="text-sm text-foreground">🏦 Bank account or debit card for deposits</Text>
            <Text className="text-sm text-foreground">💳 Social Security Number (last 4 digits for identity)</Text>
            <Text className="text-sm text-foreground">🛡️ Secure, encrypted — handled entirely by Stripe</Text>
          </View>

          {error && <Text className="text-sm text-destructive">{error}</Text>}
        </ScrollView>

        <View className="px-5 pb-4 gap-3">
          <Pressable
            onPress={handleConnect}
            disabled={loading}
            className="h-12 rounded-xl items-center justify-center bg-primary flex-row gap-2"
          >
            {loading ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-white font-bold">💰 Connect Payout Account</Text>}
          </Pressable>
          <Pressable onPress={onSkip} className="h-10 items-center justify-center">
            <Text className="text-sm text-muted-foreground text-center">
              Set up later (you won&apos;t be able to receive payments until connected)
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
