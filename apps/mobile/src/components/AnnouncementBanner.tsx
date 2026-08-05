import { getActiveAnnouncement, type Announcement } from "@reef-market/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const viewKey = (id: string) => `announcement-views-${id}`;

/**
 * No server-side per-user view-cap tracking table exists (announcements.max_views
 * has nothing to count against) — view counts are tracked client-side instead.
 */
export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveAnnouncement(apiClient)
      .then(async ({ announcement }) => {
        if (cancelled || !announcement) return;
        const raw = await AsyncStorage.getItem(viewKey(announcement.id));
        const views = raw ? Number(raw) : 0;
        if (views >= announcement.max_views) return;
        await AsyncStorage.setItem(viewKey(announcement.id), String(views + 1));
        if (!cancelled) setAnnouncement(announcement);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement) return null;

  return (
    <SafeAreaView edges={["top"]} className="bg-primary">
      <View className="flex-row items-start gap-3 px-4 py-3">
        <View className="flex-1">
          <Text className="text-sm font-bold text-white">{announcement.subject}</Text>
          <Text className="text-xs text-white/80 mt-0.5">{announcement.message}</Text>
        </View>
        <Pressable onPress={() => setAnnouncement(null)} className="p-1">
          <X size={16} color={themeColors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
