import { listOrders, type Order } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { AuthGate } from "@/components/AuthGate";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export default function OrdersScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [purchasesRes, salesRes] = await Promise.all([listOrders(apiClient, "buyer"), listOrders(apiClient, "seller")]);
      setPurchases(purchasesRes.orders);
      setSales(salesRes.orders);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  if (!session) {
    return <AuthGate title="Sign in to view orders" message="Create an account to track your purchases and sales." />;
  }

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
                  <View className="shrink-0">
                    <OrderStatusBadge status={item.status} />
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
