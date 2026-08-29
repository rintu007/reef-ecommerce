import { listSellerPayoutAccounts, type SellerPayoutStatus } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

type StatusFilter = "all" | "enabled" | "verifying" | "incomplete";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "enabled", label: "Payouts Enabled" },
  { value: "verifying", label: "Verifying" },
  { value: "incomplete", label: "Incomplete" },
];

function statusOf(account: SellerPayoutStatus): { label: string; bg: string; fg: string; filter: StatusFilter } {
  if (account.payouts_enabled) return { label: "Payouts Enabled", bg: "#d1fae5", fg: "#047857", filter: "enabled" };
  if (account.onboarding_complete) return { label: "Verifying", bg: "#fef3c7", fg: "#92400e", filter: "verifying" };
  return { label: "Onboarding Incomplete", bg: "#f3f4f6", fg: "#4b5563", filter: "incomplete" };
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function SellerPayoutsContent() {
  const [accounts, setAccounts] = useState<SellerPayoutStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    listSellerPayoutAccounts(apiClient)
      .then((res) => setAccounts(res.accounts))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? accounts : accounts.filter((a) => statusOf(a).filter === filter)),
    [accounts, filter]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No sellers match this filter.</Text>
      ) : (
        <View className="gap-2">
          {filtered.map((account) => {
            const status = statusOf(account);
            return (
              <View
                key={account.user_id}
                className="rounded-xl border border-border bg-card p-3 flex-row items-center justify-between gap-3"
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {account.user_display_name || account.user_email || account.user_id}
                  </Text>
                  {account.user_display_name && account.user_email && (
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {account.user_email}
                    </Text>
                  )}
                  <Text className="text-xs text-muted-foreground mt-1">Updated {new Date(account.updated_at).toLocaleDateString()}</Text>
                </View>
                <View className="shrink-0 px-2.5 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: status.fg }}>
                    {status.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

export default function AdminSellerPayoutsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Seller Payouts</Text>
        </View>
        <SellerPayoutsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
