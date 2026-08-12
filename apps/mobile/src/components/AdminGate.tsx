import { getOwnProfile } from "@reef-market/shared";
import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

/**
 * Gates every apps/mobile/src/app/admin/** screen behind profile.role === "admin",
 * mirroring the per-page `if (user.role !== "admin") redirect("/browse")` check
 * each apps/web/src/app/admin/** page does server-side. Mobile has no server-side
 * redirect equivalent, so this re-fetches the profile client-side on every screen —
 * intentionally not cached/shared, admin screens are low-traffic.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "denied" | "allowed">("loading");

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getOwnProfile(apiClient)
      .then(({ profile }) => {
        if (!cancelled) setStatus(profile.role === "admin" ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session || status === "denied") {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-base font-semibold text-foreground text-center">Access restricted</Text>
        <Text className="text-sm text-muted-foreground text-center mt-2">This area is for admins only.</Text>
        <Text className="text-sm font-semibold text-primary mt-4" onPress={() => router.replace("/(tabs)/browse")}>
          Back to Browse
        </Text>
      </SafeAreaView>
    );
  }

  if (status === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}
