import { adminUnblockUser, listAllBlockedUsers, type AdminBlockedUser } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const PAGE_SIZE = 100;

function BlockedUsersContent() {
  const [rows, setRows] = useState<AdminBlockedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (nextOffset: number, replace: boolean) => {
    setLoading(true);
    try {
      const { blockedUsers, total } = await listAllBlockedUsers(apiClient, { limit: PAGE_SIZE, offset: nextOffset });
      setRows((prev) => (replace ? blockedUsers : [...prev, ...blockedUsers]));
      setTotal(total);
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnblock(id: string) {
    const confirmed = await confirmAsync("Remove this block?", "The blocker will be able to be contacted by the blocked user again.", "Unblock");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await adminUnblockUser(apiClient, id);
      await load(0, true);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to unblock");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text className="text-xs text-muted-foreground">
        {total} block{total === 1 ? "" : "s"}
      </Text>

      {loading && rows.length === 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : rows.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No one has blocked anyone yet.</Text>
      ) : (
        <View className="gap-2">
          {rows.map((row) => {
            const isBusy = busyId === row.id;
            return (
              <View key={row.id} className="rounded-xl border border-border bg-card p-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {row.blocker?.display_name ?? row.blocker?.email ?? row.blocker_id} blocked{" "}
                      {row.blocked?.display_name ?? row.blocked?.email ?? row.blocked_id}
                    </Text>
                    {row.reason && <Text className="text-sm text-muted-foreground mt-1">{row.reason}</Text>}
                    <Text className="text-xs text-muted-foreground mt-1">{new Date(row.created_at).toLocaleString()}</Text>
                  </View>
                  <Pressable onPress={() => handleUnblock(row.id)} disabled={isBusy} className="shrink-0">
                    <Text className="text-sm font-semibold text-destructive" style={isBusy ? { opacity: 0.5 } : undefined}>
                      Unblock
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {rows.length < total && (
        <Pressable onPress={() => load(offset + PAGE_SIZE, false)} disabled={loading} className="mt-2 py-2.5 rounded-lg bg-muted items-center">
          <Text className="text-sm font-semibold text-muted-foreground">{loading ? "Loading…" : "Load more"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export default function AdminBlockedUsersScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Blocked Users</Text>
        </View>
        <BlockedUsersContent />
      </SafeAreaView>
    </AdminGate>
  );
}
