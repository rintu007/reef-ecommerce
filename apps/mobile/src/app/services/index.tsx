import { SERVICE_TYPE_LABELS, listServices, type Service } from "@reef-market/shared";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

type MarketFilter = "all" | "saltwater" | "freshwater";

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-foreground" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

export default function ServicesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [market, setMarket] = useState<MarketFilter>("all");
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { services, total } = await listServices(apiClient, { market: market === "all" ? undefined : market, limit: 48 });
      setServices(services);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-1">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground flex-1">Services</Text>
        {session && (
          <Pressable
            onPress={() => router.push("/services/new")}
            className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-2"
          >
            <Plus size={14} color={themeColors.white} />
            <Text className="text-xs font-semibold text-white">Post</Text>
          </Pressable>
        )}
      </View>
      <Text className="text-sm text-muted-foreground px-4 pb-2">Local aquarium services from hobbyists in your area</Text>

      <View className="flex-row gap-2 px-4 pb-3">
        <Pill label="All" active={market === "all"} onPress={() => setMarket("all")} />
        <Pill label="Saltwater" active={market === "saltwater"} onPress={() => setMarket("saltwater")} />
        <Pill label="Freshwater" active={market === "freshwater"} onPress={() => setMarket("freshwater")} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            services.length > 0 ? <Text className="text-xs text-muted-foreground">{total} service(s)</Text> : null
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-base text-foreground mb-1">No services posted yet</Text>
              <Text className="text-sm text-muted-foreground text-center">Be the first to offer a local aquarium service!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row gap-3 rounded-xl border border-border bg-card p-3">
              {item.photos[0] && (
                <View className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image source={{ uri: item.photos[0] }} style={{ width: 80, height: 80 }} contentFit="cover" />
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-muted-foreground">{SERVICE_TYPE_LABELS[item.service_type]}</Text>
                <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                  {[item.location, item.service_area && `Serves: ${item.service_area}`].filter(Boolean).join(" · ")}
                </Text>
                {item.price_range && <Text className="text-xs text-foreground mt-1">{item.price_range}</Text>}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
