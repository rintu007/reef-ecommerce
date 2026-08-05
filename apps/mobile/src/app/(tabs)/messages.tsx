import { listConversations, type ConversationSummary } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { conversations } = await listConversations(apiClient);
      setConversations(conversations);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2">
        <Text className="text-xl font-bold text-foreground">Messages</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">No conversations yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={`/messages/${item.id}`} asChild>
              <Pressable testID={`conversation-${item.id}`} className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <View className="w-10 h-10 rounded-full overflow-hidden bg-muted items-center justify-center shrink-0">
                  {item.other_participant.avatar_url ? (
                    <Image source={{ uri: item.other_participant.avatar_url }} style={{ width: 40, height: 40 }} contentFit="cover" />
                  ) : (
                    <Text className="text-lg">👤</Text>
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.other_participant.display_name ?? "Reef Market User"}
                    </Text>
                    <Text className="text-xs text-muted-foreground shrink-0">{timeAgo(item.last_message_at)}</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {item.last_message?.content ?? ""}
                  </Text>
                </View>
                {item.unread_count > 0 && (
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center shrink-0">
                    <Text className="text-white text-[10px] font-semibold">{item.unread_count}</Text>
                  </View>
                )}
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}
