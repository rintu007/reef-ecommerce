import { computeCheckoutBreakdown, fromCents } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { themeColors } from "@/lib/theme-colors";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { safeGoBack } from "@/lib/navigation";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`text-sm ${emphasis ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</Text>
      <Text className={`text-sm ${emphasis ? "font-semibold text-foreground" : "text-foreground"}`}>{value}</Text>
    </View>
  );
}

export default function FeeCalculatorScreen() {
  const router = useRouter();
  const [price, setPrice] = useState("25.00");
  const [quantity, setQuantity] = useState("1");
  const [shippingMethod, setShippingMethod] = useState<"shipping" | "local_pickup">("shipping");
  const [shippingCost, setShippingCost] = useState("6.00");
  const [featured, setFeatured] = useState(false);

  const breakdown = useMemo(() => {
    const priceNum = Number(price) || 0;
    const quantityNum = Math.max(1, Number(quantity) || 1);
    return computeCheckoutBreakdown({
      price: priceNum,
      quantity: quantityNum,
      shippingMethod,
      flatShippingCost: Number(shippingCost) || 0,
      featured,
    });
  }, [price, quantity, shippingMethod, shippingCost, featured]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Selling Fee Calculator</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text className="text-sm text-muted-foreground">
          Estimate what you&apos;ll actually receive after Reef Market&apos;s platform fee and Stripe&apos;s processing fee.
        </Text>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-muted-foreground mb-1">Price ($)</Text>
            <TextInput
              testID="fee-calc-price-input"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-muted-foreground mb-1">Quantity</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
            />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-muted-foreground mb-1">Delivery</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShippingMethod("shipping")}
              className={`px-3 py-2 rounded-full ${shippingMethod === "shipping" ? "bg-primary" : "bg-muted"}`}
            >
              <Text className={`text-xs font-semibold ${shippingMethod === "shipping" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                Ship to buyer
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShippingMethod("local_pickup")}
              className={`px-3 py-2 rounded-full ${shippingMethod === "local_pickup" ? "bg-primary" : "bg-muted"}`}
            >
              <Text
                className={`text-xs font-semibold ${shippingMethod === "local_pickup" ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                Local pickup
              </Text>
            </Pressable>
          </View>
        </View>

        {shippingMethod === "shipping" && (
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1">Shipping cost charged to buyer ($)</Text>
            <TextInput
              value={shippingCost}
              onChangeText={setShippingCost}
              keyboardType="decimal-pad"
              className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground"
            />
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-foreground">Featured listing fee</Text>
          <ToggleSwitch value={featured} onValueChange={setFeatured} />
        </View>

        <View className="rounded-xl border border-border bg-muted p-4">
          <Row label="Item subtotal" value={`$${fromCents(breakdown.itemSubtotalCents).toFixed(2)}`} />
          {shippingMethod === "shipping" && <Row label="Shipping charged to buyer" value={`$${fromCents(breakdown.shippingCents).toFixed(2)}`} />}
          <Row label="Buyer pays (total)" value={`$${fromCents(breakdown.totalChargedCents).toFixed(2)}`} emphasis />
          <View className="h-px bg-border my-2" />
          <Row label="Platform fee (5%)" value={`-$${fromCents(breakdown.platformFeeCents).toFixed(2)}`} />
          {featured && <Row label="Featured listing fee" value={`-$${fromCents(breakdown.featuredFeeCents).toFixed(2)}`} />}
          <Row label="Est. Stripe processing fee" value={`-$${fromCents(breakdown.stripeFeeEstimateCents).toFixed(2)}`} />
          <View className="h-px bg-border my-2" />
          <Row label="You receive (estimate)" value={`$${fromCents(breakdown.sellerReceivesEstimateCents).toFixed(2)}`} emphasis />
        </View>

        <Text className="text-xs text-muted-foreground">
          This is an estimate only — actual payout is determined by Stripe at the time of sale.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
