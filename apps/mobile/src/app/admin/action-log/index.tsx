import { listAdminActionLog, type AdminActionLogEntry } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const TARGET_TYPES = ["all", "order", "listing", "user", "report", "announcement", "promo_code", "help_content"];
const PAGE_SIZE = 100;

function humanize(action: string): string {
  return action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function detailsSummary(details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ");
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold capitalize ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

function ActionLogContent() {
  const [entries, setEntries] = useState<AdminActionLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState("all");

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { entries: page, total } = await listAdminActionLog(apiClient, {
          target_type: targetType === "all" ? undefined : targetType,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setEntries((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [targetType]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View className="flex-row flex-wrap gap-2">
        {TARGET_TYPES.map((t) => (
          <Chip key={t} label={t.replace("_", " ")} active={targetType === t} onPress={() => setTargetType(t)} />
        ))}
      </View>

      <Text className="text-xs text-muted-foreground">
        {total} action{total === 1 ? "" : "s"}
      </Text>

      {loading && entries.length === 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No actions logged in this view.</Text>
      ) : (
        <View className="gap-2">
          {entries.map((entry) => {
            const summary = detailsSummary(entry.details);
            return (
              <View key={entry.id} className="rounded-xl border border-border bg-card p-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">{humanize(entry.action)}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      {entry.admin_display_name ?? entry.admin_email ?? entry.admin_id} · {entry.target_type}
                      {entry.target_id && ` #${entry.target_id.slice(0, 8)}`}
                    </Text>
                    {summary && (
                      <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                        {summary}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground shrink-0">{new Date(entry.created_at).toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {entries.length < total && (
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

export default function AdminActionLogScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Action Log</Text>
        </View>
        <ActionLogContent />
      </SafeAreaView>
    </AdminGate>
  );
}
