import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePayoutStatus } from "@/lib/use-payout-status";
import { themeColors } from "@/lib/theme-colors";

/**
 * Trimmed down from a 3-step explainer + fee breakdown table + requirements
 * list — all true and useful, but it was a wall of reading before a
 * non-technical seller even reached the one button that matters. Stripe's
 * own hosted form still asks for bank details etc. (that's required KYC,
 * not something this app can shorten), but getting there from here is now
 * one line and one tap.
 */
export function PayoutSetupPrompt({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const { connecting, error, connect } = usePayoutStatus();

  async function handleConnect() {
    // connect() always refetches status itself after the browser session
    // closes — only auto-advance once that refetch actually confirms
    // Stripe enabled payouts, not just because the browser closed (which
    // happens whether the user finished onboarding or just backed out).
    const status = await connect();
    if (status.payoutsEnabled) onContinue();
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background justify-center px-6 gap-8">
        <View className="items-center gap-3">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
            <Text className="text-3xl">💰</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Get Paid for Your Sales</Text>
          <Text className="text-sm text-muted-foreground text-center px-4">
            One quick step with Stripe (your bank details, done securely on their end) and you&apos;re ready to
            receive money when something sells.
          </Text>
        </View>

        {error && <Text className="text-sm text-destructive text-center">{error}</Text>}

        <View className="gap-3">
          <Pressable
            onPress={handleConnect}
            disabled={connecting}
            className="h-14 rounded-xl items-center justify-center bg-primary flex-row gap-2"
          >
            {connecting ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-white font-bold text-base">Connect & Get Paid</Text>}
          </Pressable>
          <Pressable onPress={onSkip} className="h-10 items-center justify-center">
            <Text className="text-sm text-muted-foreground text-center">Maybe later</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
