import { getAdminAnalytics, type AdminAnalytics } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { MiniPieChart } from "@/components/admin/MiniCharts";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 min-w-[45%] rounded-xl border border-border bg-card p-4">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted-foreground mt-1">{label}</Text>
    </View>
  );
}

function SalesAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics(apiClient)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Total Revenue (GMV)" value={`$${analytics.orders.revenue.total.toFixed(2)}`} />
        <StatCard label="Platform Earnings" value={`$${analytics.orders.revenue.platformFee.toFixed(2)}`} />
        <StatCard label="Total Orders" value={String(analytics.orders.total)} />
        <StatCard label="Completed" value={String(analytics.orders.completed)} />
        <StatCard label="Avg Order" value={`$${analytics.orders.revenue.avg.toFixed(2)}`} />
      </View>
      <Text className="text-xs text-muted-foreground -mt-2">
        Total Revenue is gross order value (what buyers paid). Platform Earnings is your actual 5% + featured-fee take on completed orders.
      </Text>

      <View className="gap-3">
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="font-semibold text-sm text-foreground mb-2">Order Status</Text>
          {analytics.orders.completed + analytics.orders.pending === 0 ? (
            <Text className="text-sm text-muted-foreground text-center py-8">No orders yet.</Text>
          ) : (
            <MiniPieChart
              data={[
                { label: "Completed", value: analytics.orders.completed },
                { label: "Pending", value: analytics.orders.pending },
              ]}
            />
          )}
        </View>
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="font-semibold text-sm text-foreground mb-2">Listing Status</Text>
          {analytics.listings.active + analytics.listings.sold + analytics.listings.removed === 0 ? (
            <Text className="text-sm text-muted-foreground text-center py-8">No listings yet.</Text>
          ) : (
            <MiniPieChart
              data={[
                { label: "Active", value: analytics.listings.active },
                { label: "Sold", value: analytics.listings.sold },
                { label: "Removed", value: analytics.listings.removed },
              ]}
            />
          )}
        </View>
      </View>

      <View className="rounded-xl border border-border bg-card p-4">
        <Text className="font-semibold text-sm text-foreground mb-3">Revenue by Order Status</Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs">Completed</Text>
            <Text className="font-semibold text-foreground">${analytics.orders.revenue.byStatus.completed.toFixed(2)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs">Pending</Text>
            <Text className="font-semibold text-foreground">${analytics.orders.revenue.byStatus.pending.toFixed(2)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs">Cancelled</Text>
            <Text className="font-semibold text-foreground">${analytics.orders.revenue.byStatus.cancelled.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View>
        <Text className="font-semibold text-sm text-foreground mb-3">Activity (Last 30 Days)</Text>
        <View className="flex-row flex-wrap gap-3">
          <StatCard label="New Orders" value={String(analytics.recentActivity.ordersLast30Days)} />
          <StatCard label="New Listings" value={String(analytics.recentActivity.listingsLast30Days)} />
          <StatCard label="New Users" value={String(analytics.recentActivity.usersLast30Days)} />
        </View>
      </View>
    </ScrollView>
  );
}

export default function SalesAnalyticsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Sales Analytics</Text>
        </View>
        <SalesAnalyticsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
