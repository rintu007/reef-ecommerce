import { listAdminSubscriptions, type AdminSubscription, type SubscriptionStatus } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const STATUS_TABS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const STATUS_COLOR: Record<SubscriptionStatus, { bg: string; fg: string }> = {
  active: { bg: "#d1fae5", fg: "#047857" },
  trialing: { bg: "#dbeafe", fg: "#1d4ed8" },
  past_due: { bg: "#fef3c7", fg: "#92400e" },
  cancelled: { bg: "#f3f4f6", fg: "#4b5563" },
};

const PAGE_SIZE = 100;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function SubscriptionsContent() {
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { subscriptions: page, total } = await listAdminSubscriptions(apiClient, {
          status: status === "all" ? undefined : status,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setSubscriptions((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View className="flex-row flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Chip key={tab.value} label={tab.label} active={status === tab.value} onPress={() => setStatus(tab.value)} />
        ))}
      </View>

      <Text className="text-xs text-muted-foreground">
        {total} subscription{total === 1 ? "" : "s"}
      </Text>

      {loading && subscriptions.length === 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : subscriptions.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No subscriptions match this filter.</Text>
      ) : (
        <View className="gap-2">
          {subscriptions.map((sub) => {
            const colors = STATUS_COLOR[sub.status];
            return (
              <View key={sub.id} className="flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {sub.user_display_name ?? sub.user_email ?? sub.user_id}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                    {sub.plan_slug} · {sub.payment_provider ?? "no provider"}
                    {sub.current_period_end ? ` · renews/ends ${sub.current_period_end}` : ""}
                  </Text>
                </View>
                <View className="shrink-0 px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.fg }}>
                    {sub.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {subscriptions.length < total && (
        <Pressable
          onPress={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-2 py-2.5 rounded-lg bg-muted items-center"
        >
          <Text className="text-sm font-semibold text-muted-foreground">{loading ? "Loading…" : "Load more"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export default function AdminSubscriptionsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Subscriptions</Text>
        </View>
        <SubscriptionsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
