import { listAdminUsers, updateUserRole, type Profile, type UserRole } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

function AdminUsersContent() {
  const { session } = useAuth();
  const currentUserId = session?.user.id;
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const { users, total } = await listAdminUsers(apiClient, { q: search || undefined, limit: 100 });
      setUsers(users);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced on typing (immediate on mount/empty query), mirroring both
  // apps/web/src/app/admin/users/AdminUsersTable.tsx's 300ms debounce and this
  // app's own search-list convention in (tabs)/browse.tsx.
  useEffect(() => {
    const timer = setTimeout(() => load(q), q ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleAdmin(user: Profile) {
    const nextRole: UserRole = user.role === "admin" ? "user" : "admin";
    setBusyId(user.id);
    try {
      await updateUserRole(apiClient, user.id, nextRole);
      await load(q);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 bg-muted rounded-xl px-3 h-10 mx-4 mt-3 mb-1">
        <Search size={16} color={themeColors.mutedForeground} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by email or name…"
          placeholderTextColor={themeColors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-sm text-foreground"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10 }}
          ListHeaderComponent={
            users.length > 0 ? <Text className="text-xs text-muted-foreground mb-1">{total} user(s)</Text> : null
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">No users found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBusy = busyId === item.id;
            const isSelf = item.id === currentUserId;
            return (
              <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <View className="w-9 h-9 rounded-full overflow-hidden bg-muted items-center justify-center shrink-0">
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={{ width: 36, height: 36 }} contentFit="cover" />
                  ) : (
                    <Text className="text-sm">👤</Text>
                  )}
                </View>
                <Link href={`/sellers/${item.id}`} asChild>
                  <Pressable className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.display_name ?? "Unnamed"}
                    </Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {item.email}
                    </Text>
                  </Pressable>
                </Link>
                <View className={`px-2 py-1 rounded-full shrink-0 ${item.role === "admin" ? "bg-primary" : "bg-muted"}`}>
                  <Text className={`text-[10px] font-semibold ${item.role === "admin" ? "text-white" : "text-muted-foreground"}`}>
                    {item.role}
                  </Text>
                </View>
                <Pressable onPress={() => toggleAdmin(item)} disabled={isBusy || isSelf} className="shrink-0">
                  <Text className="text-xs font-semibold text-primary" style={{ opacity: isBusy || isSelf ? 0.4 : 1 }}>
                    {item.role === "admin" ? "Revoke admin" : "Make admin"}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

export default function AdminUsersScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Users</Text>
        </View>
        <AdminUsersContent />
      </SafeAreaView>
    </AdminGate>
  );
}
