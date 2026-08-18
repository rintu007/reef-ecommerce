import { getService, type Service } from "@reef-market/shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ServiceForm } from "@/components/ServiceForm";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getService(apiClient, id)
      .then(({ service }) => {
        if (cancelled) return;
        if (service.provider_id !== session?.user.id) {
          setForbidden(true);
        } else {
          setService(service);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, session?.user.id]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Edit Service</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : forbidden || !service ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center">You can only edit your own services.</Text>
        </View>
      ) : (
        <ServiceForm mode="edit" serviceId={service.id} initial={service} />
      )}
    </SafeAreaView>
  );
}
