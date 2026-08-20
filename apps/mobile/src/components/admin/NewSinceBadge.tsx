import { listAdminReports, listDoaClaims } from "@reef-market/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { apiClient } from "@/lib/api-client";

export const REPORTS_BADGE_KEY = "admin_badge_reports_pending";
export const DOA_CLAIMS_BADGE_KEY = "admin_badge_doa_claims_pending";

type BadgeKind = "reports" | "doa_claims";

async function fetchPendingCount(kind: BadgeKind): Promise<number> {
  if (kind === "reports") {
    const { total } = await listAdminReports(apiClient, { status: "pending", limit: 1 });
    return total;
  }
  const { total } = await listDoaClaims(apiClient, { status: "pending", limit: 1 });
  return total;
}

function storageKeyFor(kind: BadgeKind): string {
  return kind === "reports" ? REPORTS_BADGE_KEY : DOA_CLAIMS_BADGE_KEY;
}

/** In-app-only counterpart to apps/web's NewSinceBadge — same local last-seen-count logic, backed by AsyncStorage instead of localStorage. */
export function NewSinceBadge({ kind }: { kind: BadgeKind }) {
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const storageKey = storageKeyFor(kind);
    fetchPendingCount(kind).then(async (current) => {
      const lastSeenRaw = await AsyncStorage.getItem(storageKey);
      if (lastSeenRaw === null) {
        await AsyncStorage.setItem(storageKey, String(current));
        return;
      }
      const lastSeen = Number(lastSeenRaw);
      setNewCount(Math.max(0, current - lastSeen));
    });
  }, [kind]);

  if (newCount === 0) return null;
  return (
    <View className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 items-center justify-center ml-2">
      <Text className="text-white text-[11px] font-bold">+{newCount}</Text>
    </View>
  );
}

export async function markAdminBadgeSeen(kind: BadgeKind, currentCount: number) {
  await AsyncStorage.setItem(storageKeyFor(kind), String(currentCount));
}
