import { listOrders, type Order } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#f3f4f6", text: "#374151" },
  confirmed: { bg: "#dbeafe", text: "#1e40af" },
  shipped: { bg: "#e0e7ff", text: "#3730a3" },
  delivered: { bg: "#e0e7ff", text: "#3730a3" },
  awaiting_pickup: { bg: "#fef9c3", text: "#854d0e" },
  completed: { bg: "#d1fae5", text: "#065f46" },
  cancelled: { bg: "#e5e7eb", text: "#374151" },
  doa_claim: { bg: "#fee2e2", text: "#991b1b" },
  pickup_confirmed: { bg: "#d1fae5", text: "#065f46" },
};

export default function OrdersScreen() {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [purchasesRes, salesRes] = await Promise.all([listOrders(apiClient, "buyer"), listOrders(apiClient, "seller")]);
      setPurchases(purchasesRes.orders);
      setSales(salesRes.orders);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  const orders = tab === "purchases" ? purchases : sales;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2">
        <Text className="text-xl font-bold text-foreground mb-3">Orders</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setTab("purchases")} className={`px-4 py-2 rounded-full ${tab === "purchases" ? "bg-primary" : "bg-muted"}`}>
            <Text className={`text-sm font-semibold ${tab === "purchases" ? "text-primary-foreground" : "text-muted-foreground"}`}>
              Purchases ({purchases.length})
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab("sales")} className={`px-4 py-2 rounded-full ${tab === "sales" ? "bg-primary" : "bg-muted"}`}>
            <Text className={`text-sm font-semibold ${tab === "sales" ? "text-primary-foreground" : "text-muted-foreground"}`}>
              Sales ({sales.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">No {tab} yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_STYLES[item.status] ?? { bg: "#f3f4f6", text: "#374151" };
            return (
              <Link href={`/orders/${item.id}`} asChild>
                <Pressable className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <View className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.listing_photo && <Image source={{ uri: item.listing_photo }} style={{ width: 56, height: 56 }} contentFit="cover" />}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.listing_title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Qty {item.quantity} · ${(item.total_charged ?? item.price).toFixed(2)}
                    </Text>
                  </View>
                  <View className="rounded-full px-2 py-1 shrink-0" style={{ backgroundColor: statusStyle.bg }}>
                    <Text className="text-[10px] font-semibold capitalize" style={{ color: statusStyle.text }}>
                      {item.status.replace("_", " ")}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
