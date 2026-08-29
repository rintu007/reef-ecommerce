import { listAdminVisitorLogs, type VisitorLog } from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

const PAGE_SIZE = 100;
const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

function VisitorLogsContent() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [guestsOnly, setGuestsOnly] = useState(false);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      try {
        const { logs: page, total } = await listAdminVisitorLogs(apiClient, {
          session_id: sessionId.trim() || undefined,
          user_email: userEmail.trim() || undefined,
          guests_only: guestsOnly || undefined,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setLogs((prev) => (replace ? page : [...prev, ...page]));
        setTotal(total);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userEmail, guestsOnly]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, true), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userEmail, guestsOnly]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <TextInput
        value={sessionId}
        onChangeText={setSessionId}
        placeholder="Session ID"
        autoCapitalize="none"
        placeholderTextColor={themeColors.mutedForeground}
        className={inputClassName}
      />
      <TextInput
        value={userEmail}
        onChangeText={setUserEmail}
        placeholder="User email contains…"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={themeColors.mutedForeground}
        className={inputClassName}
      />
      <Pressable onPress={() => setGuestsOnly((v) => !v)} className="flex-row items-center gap-2 py-1">
        <View
          className="w-5 h-5 rounded items-center justify-center"
          style={{ backgroundColor: guestsOnly ? themeColors.primary : "transparent", borderWidth: 1, borderColor: themeColors.border }}
        >
          {guestsOnly && <Text className="text-white text-xs">✓</Text>}
        </View>
        <Text className="text-sm text-foreground">Guests only</Text>
      </Pressable>

      <Text className="text-xs text-muted-foreground">
        {total} matching event{total === 1 ? "" : "s"}
      </Text>

      {loading && logs.length === 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : logs.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No visitor events match this filter.</Text>
      ) : (
        <View className="gap-1.5">
          {logs.map((log) => (
            <View key={log.id} className="rounded-lg border border-border bg-card p-2.5">
              <Text className="text-xs font-mono text-foreground">{log.path}</Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-xs text-muted-foreground">
                  {log.is_guest ? "Guest" : log.user_email ?? "Member"} · {log.session_id.slice(0, 10)}…
                </Text>
                <Text className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {logs.length < total && (
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

export default function AdminVisitorLogsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Visitor Logs</Text>
        </View>
        <VisitorLogsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
