import { listNotifications, type AppNotification } from "@reef-market/shared";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Bell, Package, ShoppingBag, Star } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { safeGoBack } from "@/lib/navigation";
import { useNotifications } from "@/lib/notifications-context";
import { themeColors } from "@/lib/theme-colors";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (new Date().getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function IconFor({ type }: { type: AppNotification["type"] }) {
  if (type === "order") return <ShoppingBag size={18} color={themeColors.primary} />;
  if (type === "review") return <Star size={18} color={themeColors.accent} />;
  if (type === "order_status") return <Package size={18} color={themeColors.primary} />;
  return <Bell size={18} color={themeColors.mutedForeground} />;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { markAllRead, open } = useNotifications();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { notifications } = await listNotifications(apiClient);
      setItems(notifications);
    } catch {
      // keep whatever was already shown
    }
  }, []);

  // Load first so unread items still render highlighted on this visit,
  // then mark everything read so the bell clears.
  useFocusEffect(
    useCallback(() => {
      async function run() {
        await load();
        setLoading(false);
        await markAllRead();
      }
      run();
    }, [load, markAllRead])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24 gap-2">
              <Bell size={28} color={themeColors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">You&apos;re all caught up.</Text>
              <Text className="text-xs text-muted-foreground text-center px-8">Orders, sales and reviews will show up here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              className={`flex-row gap-3 rounded-xl border p-3 ${item.read_at ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
            >
              <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                <IconFor type={item.type} />
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm font-semibold text-foreground flex-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</Text>
                </View>
                <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
