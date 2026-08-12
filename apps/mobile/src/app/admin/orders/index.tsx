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

// Mirrors apps/web/src/app/admin/orders/page.tsx's STATUS_STYLES, translated from
// Tailwind gray/blue/indigo/etc classes to fixed hex values the same way
// apps/mobile/src/app/(tabs)/orders.tsx already does for the buyer/seller order list.
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
        const statusStyle = STATUS_STYLES[item.status] ?? { bg: "#f3f4f6", text: "#374151" };
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
              <View className="rounded-full px-2 py-1 shrink-0" style={{ backgroundColor: statusStyle.bg }}>
                <Text className="text-[10px] font-semibold capitalize" style={{ color: statusStyle.text }}>
                  {item.status.replace("_", " ")}
                </Text>
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
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Orders</Text>
        </View>
        <AdminOrdersContent />
      </SafeAreaView>
    </AdminGate>
  );
}
