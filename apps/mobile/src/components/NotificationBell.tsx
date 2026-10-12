import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { themeColors } from "@/lib/theme-colors";

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  if (!session) return null;

  return (
    <Pressable
      testID="notification-bell"
      onPress={() => router.push("/notifications")}
      className={`w-10 h-10 rounded-xl items-center justify-center ${variant === "dark" ? "bg-white/15" : "bg-muted"}`}
    >
      <Bell size={18} color={variant === "dark" ? themeColors.white : themeColors.mutedForeground} />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-accent items-center justify-center px-1">
          <Text className="text-[9px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}
