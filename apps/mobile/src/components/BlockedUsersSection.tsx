import { listBlockedUsers, unblockUser, type BlockedUser } from "@reef-market/shared";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";

export function BlockedUsersSection() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { blockedUsers } = await listBlockedUsers(apiClient);
    setBlocked(blockedUsers);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function unblock(blockedId: string) {
    setBusyId(blockedId);
    try {
      await unblockUser(apiClient, blockedId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading || blocked.length === 0) return null;

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold text-sm text-foreground">Blocked Sellers</Text>
      <View className="mt-2 gap-2">
        {blocked.map((b) => (
          <View key={b.id} className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground flex-1 pr-2" numberOfLines={1}>
              {b.reason || "No reason given"}
            </Text>
            <Pressable onPress={() => unblock(b.blocked_id)} disabled={busyId === b.blocked_id}>
              <Text className="text-xs font-semibold text-primary">Unblock</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
