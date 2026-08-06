import { checkoutCart, computeCheckoutBreakdown, fromCents, getListing, type CartCheckoutItemResult, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { BuyerAgreementModal } from "@/components/BuyerAgreementModal";
import { useCart } from "@/lib/cart-context";
import { useCheckoutStripe } from "@/lib/stripe-checkout";
import { themeColors } from "@/lib/theme-colors";

const stripeConfigured = !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearItems } = useCart();
  const stripe = useCheckoutStripe();

  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<CartCheckoutItemResult[]>([]);
  const [paying, setPaying] = useState<{ results: CartCheckoutItemResult[]; index: number } | null>(null);
  // Buyer Agreement is shown fresh on every checkout attempt — no persistence,
  // matching legacy's BuyerAgreementModal/CheckoutModal behavior exactly.
  const [showAgreement, setShowAgreement] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    Promise.all(items.map((item) => getListing(apiClient, item.listingId).then((r) => r.listing).catch(() => null))).then((results) => {
      const map: Record<string, Listing> = {};
      results.forEach((listing) => {
        if (listing) map[listing.id] = listing;
      });
      setListings(map);
      setLoading(false);
    });
  }, [items]);

  const grouped = useMemo(() => {
    const bySeller: Record<string, typeof items> = {};
    for (const item of items) {
      const listing = listings[item.listingId];
      if (!listing) continue;
      const key = listing.seller_id;
      bySeller[key] = [...(bySeller[key] ?? []), item];
    }
    return Object.entries(bySeller);
  }, [items, listings]);

  const grandTotalCents = useMemo(() => {
    return items.reduce((sum, item) => {
      const listing = listings[item.listingId];
      if (!listing) return sum;
      const breakdown = computeCheckoutBreakdown({
        price: listing.price,
        quantity: item.quantity,
        shippingMethod: item.shippingMethod,
        shippingTiers: listing.shipping_tiers,
        flatShippingCost: listing.shipping_cost,
        pickupPrice: listing.pickup_price,
        featured: listing.featured_fee,
      });
      return sum + breakdown.totalChargedCents;
    }, 0);
  }, [items, listings]);

  async function payNext(results: CartCheckoutItemResult[], index: number) {
    if (index >= results.length) {
      router.replace("/orders");
      return;
    }
    setPaying({ results, index });
    const current = results[index];
    try {
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: current.clientSecret!,
        merchantDisplayName: "Reef Market",
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await stripe.presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") setError(presentError.message);
        setPaying(null);
        return;
      }

      clearItems([current.listing_id]);
      await payNext(results, index + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPaying(null);
    }
  }

  async function handleCheckout() {
    if (!stripeConfigured) return;
    setCheckingOut(true);
    setError(null);
    try {
      const { results } = await checkoutCart(apiClient, {
        items: items.map((item) => ({
          listing_id: item.listingId,
          quantity: item.quantity,
          shipping_method: item.shippingMethod,
          pickup_time: item.pickupTime,
        })),
      });
      const succeeded = results.filter((r) => r.clientSecret);
      const failed = results.filter((r) => !r.clientSecret);
      setFailures(failed);
      if (succeeded.length === 0) {
        setError("None of your cart items could be checked out. See details below.");
      } else {
        await payNext(succeeded, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Your Cart</Text>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-muted-foreground">Your cart is empty.</Text>
          <Link href="/(tabs)/browse" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">Browse listings</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {!stripeConfigured && (
            <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <Text className="text-sm text-amber-800">Payments aren&apos;t configured yet in this build. Checkout can&apos;t be completed.</Text>
            </View>
          )}

          {failures.length > 0 && (
            <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <Text className="text-sm font-semibold text-amber-900">Some items couldn&apos;t be checked out:</Text>
              {failures.map((f) => (
                <Text key={f.listing_id} className="text-sm text-amber-800 mt-1">
                  {listings[f.listing_id]?.title ?? f.listing_id}: {f.error}
                </Text>
              ))}
            </View>
          )}

          {paying && (
            <View className="rounded-xl border border-border bg-muted p-3 items-center">
              <ActivityIndicator color={themeColors.primary} />
              <Text className="text-sm text-muted-foreground mt-1">
                Paying item {paying.index + 1} of {paying.results.length}…
              </Text>
            </View>
          )}

          {grouped.map(([sellerId, sellerItems]) => (
            <View key={sellerId} className="rounded-xl border border-border bg-card p-4 gap-3">
              {sellerItems.map((item) => {
                const listing = listings[item.listingId];
                if (!listing) return null;
                return (
                  <View key={item.listingId} className="flex-row items-center gap-3">
                    <View className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {listing.photos[0] && <Image source={{ uri: listing.photos[0] }} style={{ width: 56, height: 56 }} contentFit="cover" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                        {listing.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground">${listing.price.toFixed(2)} each</Text>
                    </View>
                    <TextInput
                      value={String(item.quantity)}
                      onChangeText={(v) => {
                        const n = Number(v.replace(/[^0-9]/g, ""));
                        if (n) updateQuantity(item.listingId, Math.max(listing.min_qty, Math.min(listing.quantity, n)));
                      }}
                      keyboardType="number-pad"
                      className="w-12 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground text-center"
                    />
                    <Pressable onPress={() => removeItem(item.listingId)}>
                      <Text className="text-xs font-semibold text-destructive">Remove</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          <View className="rounded-xl border border-border bg-muted p-4 flex-row justify-between">
            <Text className="text-sm font-semibold text-foreground">Estimated total</Text>
            <Text className="text-sm font-semibold text-foreground">${fromCents(grandTotalCents).toFixed(2)}</Text>
          </View>

          {error && <Text className="text-sm text-destructive">{error}</Text>}

          <Pressable
            testID="cart-checkout-button"
            onPress={() => setShowAgreement(true)}
            disabled={checkingOut || !!paying || !stripeConfigured}
            className={`rounded-xl py-3 items-center ${checkingOut || paying || !stripeConfigured ? "bg-muted" : "bg-primary"}`}
          >
            {checkingOut ? (
              <ActivityIndicator color={themeColors.white} />
            ) : (
              <Text className={`font-semibold text-sm ${!stripeConfigured ? "text-muted-foreground" : "text-white"}`}>
                Checkout {items.length} item{items.length === 1 ? "" : "s"}
              </Text>
            )}
          </Pressable>
          <Text className="text-xs text-muted-foreground text-center">
            You&apos;ll pay for each item one at a time — Stripe processes each seller&apos;s sale separately.
          </Text>
        </ScrollView>
      )}

      {showAgreement && (
        <BuyerAgreementModal
          onAgree={() => {
            setShowAgreement(false);
            handleCheckout();
          }}
          onClose={() => setShowAgreement(false)}
        />
      )}
    </SafeAreaView>
  );
}
