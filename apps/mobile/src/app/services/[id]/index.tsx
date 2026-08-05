import { SERVICE_TYPE_LABELS, deleteService, getService, type Service } from "@reef-market/shared";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Phone, Truck } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { themeColors } from "@/lib/theme-colors";

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return getService(apiClient, id)
      .then(({ service }) => setService(service))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDelete() {
    if (!service) return;
    const confirmed = await confirmAsync("Delete this service?", "This can't be undone.", "Delete");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteService(apiClient, service.id);
      router.replace("/services");
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete service");
      setDeleting(false);
    }
  }

  if (loading || !service) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  const isOwner = session?.user.id === service.provider_id;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <ArrowLeft size={20} color={themeColors.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
          {service.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {service.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {service.photos.map((url) => (
              <View key={url} className="w-40 h-40 rounded-xl overflow-hidden bg-muted">
                <Image source={{ uri: url }} style={{ width: 160, height: 160 }} contentFit="cover" />
              </View>
            ))}
          </ScrollView>
        )}

        <Text className="text-xl font-bold text-foreground">{service.title}</Text>
        <Text className="text-sm text-muted-foreground">{SERVICE_TYPE_LABELS[service.service_type]}</Text>

        {service.description && <Text className="text-sm text-foreground leading-5">{service.description}</Text>}

        <View className="gap-2 pt-2">
          {service.location && (
            <View className="flex-row items-center gap-2">
              <MapPin size={14} color={themeColors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">{service.location}</Text>
            </View>
          )}
          {service.service_area && (
            <View className="flex-row items-center gap-2">
              <Truck size={14} color={themeColors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">Serves: {service.service_area}</Text>
            </View>
          )}
          {service.ships_nationwide && <Text className="text-sm text-muted-foreground">Also offers remote/shipped service nationwide</Text>}
          {service.contact_info && (
            <View className="flex-row items-center gap-2">
              <Phone size={14} color={themeColors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">{service.contact_info}</Text>
            </View>
          )}
        </View>

        {service.price_range && <Text className="text-base font-bold text-foreground pt-2">{service.price_range}</Text>}

        {isOwner && (
          <View className="flex-row gap-3 pt-4">
            <Link href={`/services/${service.id}/edit`} asChild>
              <Pressable className="flex-1 h-11 rounded-xl border border-border items-center justify-center">
                <Text className="text-sm font-semibold text-foreground">Edit</Text>
              </Pressable>
            </Link>
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl border border-destructive items-center justify-center"
            >
              {deleting ? (
                <ActivityIndicator color={themeColors.destructive} />
              ) : (
                <Text className="text-sm font-semibold text-destructive">Delete</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
