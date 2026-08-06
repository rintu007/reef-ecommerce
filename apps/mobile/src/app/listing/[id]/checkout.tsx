import { checkout, computeCheckoutBreakdown, fromCents, getListing, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { BuyerAgreementModal } from "@/components/BuyerAgreementModal";
import { useCheckoutStripe } from "@/lib/stripe-checkout";
import { themeColors } from "@/lib/theme-colors";

const stripeConfigured = !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stripe = useCheckoutStripe();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<"shipping" | "local_pickup">("shipping");
  const [pickupTime, setPickupTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Buyer Agreement is shown fresh on every checkout attempt — no persistence,
  // matching legacy's BuyerAgreementModal/CheckoutModal behavior exactly.
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getListing(apiClient, id)
      .then(({ listing }) => {
        if (cancelled) return;
        setListing(listing);
        setQuantity(listing.min_qty);
        setShippingMethod(listing.shipping_available ? "shipping" : "local_pickup");
        setPickupTime(listing.pickup_times[0] ?? "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const breakdown = useMemo(() => {
    if (!listing) return null;
    return computeCheckoutBreakdown({
      price: listing.price,
      quantity,
      shippingMethod,
      shippingTiers: listing.shipping_tiers,
      flatShippingCost: listing.shipping_cost,
      pickupPrice: listing.pickup_price,
      featured: listing.featured_fee,
    });
  }, [listing, quantity, shippingMethod]);

  async function handlePay() {
    if (!listing || !stripeConfigured) return;
    setError(null);
    setSubmitting(true);
    try {
      const { order, clientSecret } = await checkout(apiClient, {
        listing_id: listing.id,
        quantity,
        shipping_method: shippingMethod,
        pickup_time: shippingMethod === "local_pickup" ? pickupTime || undefined : undefined,
      });
      if (!clientSecret) throw new Error("Could not start payment");

      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Reef Market",
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await stripe.presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") setError(presentError.message);
        return;
      }

      router.replace(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  const canOfferShipping = listing.shipping_available;
  const canOfferPickup = listing.local_pickup;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Checkout</Text>
      </View>

      {!agreed && (
        <BuyerAgreementModal onAgree={() => setAgreed(true)} onClose={() => router.back()} />
      )}

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {!stripeConfigured && (
          <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
            <Text className="text-sm text-amber-800">
              Payments aren&apos;t configured yet in this build. Checkout can&apos;t be completed.
            </Text>
          </View>
        )}

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

        <View>
          <Text className="text-sm font-medium text-muted-foreground mb-1">Quantity</Text>
          <TextInput
            value={String(quantity)}
            onChangeText={(v) => {
              const n = Number(v.replace(/[^0-9]/g, ""));
              if (!n) return setQuantity(listing.min_qty);
              setQuantity(Math.max(listing.min_qty, Math.min(listing.quantity, n)));
            }}
            keyboardType="number-pad"
            className="w-24 border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
          />
          <Text className="text-xs text-muted-foreground mt-1">
            Min {listing.min_qty}, {listing.quantity} available
          </Text>
        </View>

        {canOfferShipping && canOfferPickup && (
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1">Delivery</Text>
            <View className="flex-row gap-2">
              <Chip label="Ship to me" active={shippingMethod === "shipping"} onPress={() => setShippingMethod("shipping")} />
              <Chip label="Local pickup" active={shippingMethod === "local_pickup"} onPress={() => setShippingMethod("local_pickup")} />
            </View>
          </View>
        )}

        {shippingMethod === "local_pickup" && listing.pickup_times.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1">Pickup time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {listing.pickup_times.map((time) => (
                <Chip key={time} label={time} active={pickupTime === time} onPress={() => setPickupTime(time)} />
              ))}
            </ScrollView>
          </View>
        )}

        {breakdown && (
          <View className="rounded-xl border border-border bg-muted p-4 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Subtotal</Text>
              <Text className="text-sm text-foreground">${fromCents(breakdown.itemSubtotalCents).toFixed(2)}</Text>
            </View>
            {shippingMethod === "shipping" && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Shipping</Text>
                <Text className="text-sm text-foreground">${fromCents(breakdown.shippingCents).toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-1 border-t border-border mt-1">
              <Text className="text-sm font-semibold text-foreground">Total</Text>
              <Text className="text-sm font-semibold text-foreground">${fromCents(breakdown.totalChargedCents).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable
          testID="pay-button"
          onPress={handlePay}
          disabled={submitting || !stripeConfigured}
          className={`rounded-xl py-3 items-center ${submitting || !stripeConfigured ? "bg-muted" : "bg-primary"}`}
        >
          {submitting ? (
            <ActivityIndicator color={themeColors.white} />
          ) : (
            <Text className={`font-semibold text-sm ${!stripeConfigured ? "text-muted-foreground" : "text-white"}`}>
              Continue to Payment
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
