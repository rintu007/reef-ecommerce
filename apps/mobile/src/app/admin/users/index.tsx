import {
  adminDeleteUser,
  banUser,
  getUserActivityStats,
  grantPromoToUser,
  listAdminUsers,
  sendMessage,
  updateUserRole,
  type Profile,
  type UserActivityStats,
} from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronUp, Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

/** Legacy parity: reef-trade-flow's admin UserManagementTab per-user stats panel. */
function UserStatsPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserActivityStats(apiClient, userId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <Text className="text-xs text-muted-foreground py-2">Loading stats…</Text>;
  if (!stats) return null;

  const cards = [
    { label: "Purchases", value: String(stats.totalPurchases), sub: `$${stats.totalSpent.toFixed(2)} spent` },
    { label: "Sales", value: String(stats.totalSales), sub: `$${stats.totalRevenue.toFixed(2)} earned` },
    { label: "Listings", value: `${stats.activeListings} active`, sub: `${stats.totalListings} total` },
    { label: "Last Active", value: stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "No activity", sub: "" },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {cards.map((c) => (
        <View key={c.label} className="bg-background rounded-lg p-2.5" style={{ width: "48%" }}>
          <Text className="text-[10px] text-muted-foreground">{c.label}</Text>
          <Text className="text-sm font-bold text-foreground">{c.value}</Text>
          {!!c.sub && <Text className="text-[10px] text-muted-foreground">{c.sub}</Text>}
        </View>
      ))}
    </View>
  );
}

function UserRow({ user, currentUserId, onChanged }: { user: Profile; currentUserId?: string; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const isSelf = user.id === currentUserId;
  const isBanned = !!user.banned_at;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirmAsync("Delete this account?", "This can't be undone.", "Delete");
    if (confirmed) run(() => adminDeleteUser(apiClient, user.id));
  }

  return (
    <View className={`rounded-xl border bg-card overflow-hidden ${isBanned ? "border-destructive/50" : "border-border"}`}>
      <Pressable onPress={() => setExpanded((e) => !e)} className="flex-row items-center gap-3 p-3">
        <View className="w-9 h-9 rounded-full overflow-hidden bg-muted items-center justify-center shrink-0">
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={{ width: 36, height: 36 }} contentFit="cover" />
          ) : (
            <Text className="text-sm">👤</Text>
          )}
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
            {user.display_name ?? "Unnamed"}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full shrink-0 ${isBanned ? "bg-destructive/15" : user.role === "admin" ? "bg-primary" : "bg-muted"}`}>
          <Text
            className={`text-[10px] font-semibold ${isBanned ? "text-destructive" : user.role === "admin" ? "text-white" : "text-muted-foreground"}`}
          >
            {isBanned ? "blocked" : user.role}
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={themeColors.mutedForeground} />
        ) : (
          <ChevronDown size={16} color={themeColors.mutedForeground} />
        )}
      </Pressable>

      {expanded && (
        <View className="border-t border-border bg-muted/30 p-3 gap-3">
          <View>
            <Text className="text-xs font-semibold text-foreground mb-1.5">Activity Stats</Text>
            <UserStatsPanel userId={user.id} />
          </View>

          {!isBanned && !isSelf && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Role</Text>
              <View className="flex-row gap-2">
                <Pressable
                  disabled={busy}
                  onPress={() => run(() => updateUserRole(apiClient, user.id, "admin"))}
                  className={`flex-1 h-8 rounded-lg items-center justify-center border ${user.role === "admin" ? "bg-foreground border-foreground" : "border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${user.role === "admin" ? "text-background" : "text-foreground"}`}>Admin</Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => run(() => updateUserRole(apiClient, user.id, "user"))}
                  className={`flex-1 h-8 rounded-lg items-center justify-center border ${user.role === "user" ? "bg-foreground border-foreground" : "border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${user.role === "user" ? "text-background" : "text-foreground"}`}>User</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!isBanned && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Apply Promo Code</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={promoCode}
                  onChangeText={(v) => setPromoCode(v.toUpperCase())}
                  placeholder="e.g. REEF2024"
                  placeholderTextColor={themeColors.mutedForeground}
                  autoCapitalize="characters"
                  className="flex-1 h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground"
                />
                <Pressable
                  disabled={busy || !promoCode.trim()}
                  onPress={() => run(() => grantPromoToUser(apiClient, user.id, promoCode.trim())).then(() => setPromoCode(""))}
                  className="h-8 rounded-lg px-3 items-center justify-center bg-primary"
                  style={{ opacity: busy || !promoCode.trim() ? 0.4 : 1 }}
                >
                  <Text className="text-xs font-semibold text-white">Apply</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!isSelf && (
            <View className="gap-2 pt-2 border-t border-border">
              <Text className="text-xs font-semibold text-destructive">Moderation</Text>
              <View className="flex-row gap-2">
                <Pressable
                  disabled={busy}
                  onPress={() => run(() => banUser(apiClient, user.id, !isBanned))}
                  className={`flex-1 h-8 rounded-lg items-center justify-center border ${isBanned ? "border-emerald-500" : "border-destructive"}`}
                >
                  <Text className={`text-xs font-semibold ${isBanned ? "text-emerald-600" : "text-destructive"}`}>
                    {isBanned ? "Unblock" : "Block User"}
                  </Text>
                </Pressable>
                <Pressable disabled={busy} onPress={handleDelete} className="h-8 rounded-lg px-3 items-center justify-center border border-destructive">
                  <Text className="text-xs font-semibold text-destructive">Delete</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!isSelf && (
            <View className="gap-1.5">
              <Pressable onPress={() => setShowMessage((s) => !s)}>
                <Text className="text-xs font-semibold text-primary">{showMessage ? "Cancel" : "Send In-App Message"}</Text>
              </Pressable>
              {showMessage && (
                <View className="gap-2">
                  <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Type your message…"
                    placeholderTextColor={themeColors.mutedForeground}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-foreground"
                    style={{ minHeight: 70 }}
                  />
                  <Pressable
                    disabled={busy || !messageText.trim()}
                    onPress={() =>
                      run(() => sendMessage(apiClient, { recipient_id: user.id, content: messageText.trim() })).then(() => {
                        setMessageText("");
                        setShowMessage(false);
                      })
                    }
                    className="h-8 rounded-lg items-center justify-center bg-primary"
                    style={{ opacity: busy || !messageText.trim() ? 0.4 : 1 }}
                  >
                    <Text className="text-xs font-semibold text-white">Send Message</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <Link href={`/sellers/${user.id}`} asChild>
            <Pressable>
              <Text className="text-xs font-semibold text-primary">View storefront →</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </View>
  );
}

function AdminUsersContent() {
  const { session } = useAuth();
  const currentUserId = session?.user.id;
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const timer = setTimeout(() => load(q), q ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const blockedCount = users.filter((u) => u.banned_at).length;

  return (
    <View className="flex-1">
      <View className="flex-row px-4 pt-3 gap-2">
        {[
          { label: "Total", value: total },
          { label: "Users", value: users.length - adminCount - blockedCount },
          { label: "Admins", value: adminCount },
          { label: "Blocked", value: blockedCount },
        ].map((s) => (
          <View key={s.label} className="flex-1 bg-card border border-border rounded-xl p-2 items-center">
            <Text className="text-lg font-extrabold text-foreground">{s.value}</Text>
            <Text className="text-[9px] text-muted-foreground">{s.label}</Text>
          </View>
        ))}
      </View>

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
          renderItem={({ item }) => <UserRow user={item} currentUserId={currentUserId} onChanged={() => load(q)} />}
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
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Users</Text>
        </View>
        <AdminUsersContent />
      </SafeAreaView>
    </AdminGate>
  );
}
