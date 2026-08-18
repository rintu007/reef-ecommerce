import { listAdminOrders, type Order } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

const CLAIM_PENDING_STYLE = { bg: "#fef3c7", text: "#92400e" };

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminOrders(apiClient, { limit: 200 })
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ListEmptyComponent={
        <View className="items-center py-24 px-6">
          <Text className="text-muted-foreground text-center">No orders yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        return (
          <Link href={`/orders/${item.id}`} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
              <View className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.listing_photo && (
                  <Image source={{ uri: item.listing_photo }} style={{ width: 48, height: 48 }} contentFit="cover" />
                )}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                  {item.listing_title}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  ${(item.total_charged ?? item.price).toFixed(2)} · Qty {item.quantity}
                </Text>
              </View>
              <View className="shrink-0">
                <OrderStatusBadge status={item.status} />
              </View>
              {item.doa_claim_status === "pending" && (
                <View className="rounded-full px-2 py-1 shrink-0" style={{ backgroundColor: CLAIM_PENDING_STYLE.bg }}>
                  <Text className="text-[10px] font-semibold" style={{ color: CLAIM_PENDING_STYLE.text }}>
                    claim pending
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

export default function AdminOrdersScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Orders</Text>
        </View>
        <AdminOrdersContent />
      </SafeAreaView>
    </AdminGate>
  );
}
