import { getListing, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

/**
 * Stripe's PaymentSheet is a native UI component with no web equivalent —
 * @stripe/stripe-react-native isn't web-bundleable at all (see
 * lib/stripe-provider.web.tsx). This is a deliberate, simpler screen for
 * the web target rather than a broken checkout.tsx port.
 */
export default function CheckoutWebScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getListing(apiClient, id)
      .then(({ listing }) => {
        if (!cancelled) setListing(listing);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Checkout</Text>
      </View>

      {loading || !listing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <View className="p-5 gap-4">
          <View className="flex-row gap-3 rounded-xl border border-border bg-card p-3">
            <View className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
              {listing.photos[0] && <Image source={{ uri: listing.photos[0] }} style={{ width: 64, height: 64 }} contentFit="cover" />}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-sm text-foreground" numberOfLines={2}>
                {listing.title}
              </Text>
              <Text className="text-sm text-muted-foreground">${listing.price.toFixed(2)} each</Text>
            </View>
          </View>

          <View className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <Text className="text-sm text-amber-800">
              Checkout is only available in the Reef Market mobile app right now. Open this listing on your phone to complete your
              purchase.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
