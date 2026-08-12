import { getAdminAnalytics, type AdminAnalytics } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { MiniBarChart } from "@/components/admin/MiniCharts";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

/** Mirrors legacy's path->label mapping (exact matches + a few known prefixes) from apps/web/src/components/admin/TopPagesList.tsx. */
const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/browse": "Browse",
  "/messages": "Messages",
  "/orders": "Orders",
  "/learn": "Learn",
  "/profile": "Profile",
  "/services": "Services",
  "/sell": "Sell",
};

function labelForPath(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/listings/")) return "Listing Detail";
  if (path.startsWith("/sellers/")) return "Seller Storefront";
  if (path.startsWith("/browse?") || path.startsWith("/browse/")) return "Browse (filtered)";
  return path;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 min-w-[28%] rounded-xl border border-border bg-card p-4">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted-foreground mt-1">{label}</Text>
    </View>
  );
}

function TopPagesList({ pages }: { pages: { path: string; count: number }[] }) {
  if (pages.length === 0) {
    return <Text className="text-sm text-muted-foreground text-center py-6">No visitor data yet.</Text>;
  }
  const max = Math.max(...pages.map((p) => p.count));

  return (
    <View className="gap-2">
      {pages.map((p) => (
        <View key={p.path}>
          <View className="flex-row justify-between mb-0.5">
            <Text className="text-xs text-muted-foreground">{labelForPath(p.path)}</Text>
            <Text className="text-xs font-semibold text-foreground">{p.count}</Text>
          </View>
          <View className="h-1.5 rounded-full bg-muted">
            <View className="h-1.5 rounded-full bg-primary" style={{ width: `${(p.count / max) * 100}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function AppAnalyticsContent() {
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
        <StatCard label="Total Users" value={String(analytics.users.total)} />
        <StatCard label="Total Listings" value={String(analytics.listings.total)} />
        <StatCard label="Total Orders" value={String(analytics.orders.total)} />
        <StatCard label="Avg Rating" value={analytics.reviews.avgRating != null ? analytics.reviews.avgRating.toFixed(1) : "—"} />
      </View>

      <View className="gap-3">
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="font-semibold text-sm text-foreground mb-3">Listings Breakdown</Text>
          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Active</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.listings.active}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Sold</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.listings.sold}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Removed</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.listings.removed}</Text>
            </View>
          </View>
        </View>
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="font-semibold text-sm text-foreground mb-3">Order Breakdown</Text>
          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Completed</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.orders.completed}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Pending</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.orders.pending}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-sm">Total Reviews</Text>
              <Text className="font-semibold text-foreground text-sm">{analytics.reviews.total}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="rounded-xl border border-border bg-card p-4">
        <Text className="font-semibold text-sm text-foreground mb-3">Visitor Stats</Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          <StatCard label="Total Page Views" value={String(analytics.visitors.total)} />
          <StatCard label="Unique Sessions" value={String(analytics.visitors.uniqueSessions)} />
          <StatCard label="Today" value={String(analytics.visitors.today)} />
          <StatCard label="Last 7 Days" value={String(analytics.visitors.last7Days)} />
          <StatCard label="Signed-In Sessions" value={String(analytics.visitors.authSessions)} />
          <StatCard label="Guest Sessions" value={String(analytics.visitors.guestSessions)} />
        </View>

        <Text className="text-xs font-semibold text-muted-foreground mb-2">Views per Day (last 30 days)</Text>
        {analytics.visitors.visitsByDay.length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-8">No visitor data yet.</Text>
        ) : (
          <MiniBarChart
            data={analytics.visitors.visitsByDay.map((d) => ({ label: d.date.slice(5), value: d.count }))}
            height={100}
          />
        )}

        <Text className="text-xs font-semibold text-muted-foreground mt-4 mb-2">Top Pages</Text>
        <TopPagesList pages={analytics.visitors.topPages} />
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

export default function AppAnalyticsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">App Analytics</Text>
        </View>
        <AppAnalyticsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
