import { getAdminStats, type AdminStats } from "@reef-market/shared";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const SECTIONS: { href: string; title: string; describe: (s: AdminStats) => string }[] = [
  {
    href: "/admin/listings",
    title: "Listings",
    describe: (s) => `${s.listings.total} total · ${s.listings.pending_approval} awaiting approval`,
  },
  { href: "/admin/reports", title: "Reports", describe: (s) => `${s.reports.pending} pending triage` },
  { href: "/admin/users", title: "Users", describe: (s) => `${s.users.total} registered` },
  { href: "/admin/orders", title: "Orders", describe: (s) => `${s.orders.total} total · ${s.orders.doa_claim} refund/credit` },
  { href: "/admin/announcements", title: "Announcements", describe: () => "Broadcast banner shown on app load" },
  { href: "/admin/help-content", title: "Learn Content", describe: () => "Care guides shown on the Learn tab" },
  { href: "/admin/promo-codes", title: "Promo Codes", describe: () => "Bonus listings & free membership grants" },
  { href: "/admin/sales-analytics", title: "Sales Analytics", describe: () => "Revenue, order status, and recent activity" },
  { href: "/admin/app-analytics", title: "App Analytics", describe: () => "Users, listings, reviews, and visitor stats" },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 min-w-[45%] rounded-xl border border-border bg-card p-4">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted-foreground mt-1">{label}</Text>
    </View>
  );
}

function AdminScreenContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats(apiClient)
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <View className="flex-row flex-wrap gap-3">
        <StatCard label="Active Listings" value={stats.listings.active} />
        <StatCard label="Pending Approval" value={stats.listings.pending_approval} />
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Pending Reports" value={stats.reports.pending} />
      </View>

      <View className="gap-2 mt-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href as never} asChild>
            <Pressable className="rounded-xl border border-border bg-card p-4">
              <Text className="font-semibold text-sm text-foreground">{section.title}</Text>
              <Text className="text-xs text-muted-foreground mt-1">{section.describe(stats)}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text className="text-xs text-muted-foreground mt-2">
        Visitors: {stats.visitors.total} total · {stats.visitors.last7Days} in the last 7 days · {stats.visitors.last30Days} in the
        last 30 days
      </Text>
    </ScrollView>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Admin</Text>
        </View>
        <AdminScreenContent />
      </SafeAreaView>
    </AdminGate>
  );
}
