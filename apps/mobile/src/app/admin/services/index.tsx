import { deleteService, listServices, updateService, SERVICE_TYPE_LABELS, type Service, type ServiceStatus } from "@reef-market/shared";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Ban, Check, Pause, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

// Mirrors apps/web/src/app/admin/services/AdminServicesTable.tsx's STATUS_TABS exactly.
const STATUS_TABS: { value: ServiceStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];

function StatusTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-white" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

type IconType = typeof Check;

function RowAction({
  icon: Icon,
  label,
  color,
  onPress,
  disabled,
}: {
  icon: IconType;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className="flex-1 items-center justify-center gap-1 py-2.5" style={{ opacity: disabled ? 0.4 : 1 }}>
      <Icon size={15} color={color} />
      <Text className="text-[10px] font-semibold" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function AdminServicesContent() {
  const [status, setStatus] = useState<ServiceStatus | "all">("active");
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { services, total } = await listServices(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setServices(services);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(load, 0);
      return () => clearTimeout(timer);
    }, [load]),
  );

  async function setStatusFor(id: string, next: ServiceStatus) {
    setBusyId(id);
    try {
      await updateService(apiClient, id, { status: next });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setBusyId(null);
    }
  }

  async function hardDelete(id: string) {
    const confirmed = await confirmAsync("Delete this service?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await deleteService(apiClient, id);
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {STATUS_TABS.map((tab) => (
          <StatusTab key={tab.value} label={tab.label} active={status === tab.value} onPress={() => setStatus(tab.value)} />
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
          ListHeaderComponent={
            services.length > 0 ? <Text className="text-xs text-muted-foreground mb-1">{total} service(s)</Text> : null
          }
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Text className="text-muted-foreground text-center">No services in this view.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBusy = busyId === item.id;
            return (
              <View className="rounded-xl border border-border bg-card overflow-hidden">
                <View className="flex-row items-center gap-3 p-3">
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                      {SERVICE_TYPE_LABELS[item.service_type]} · {item.status}
                      {item.location ? ` · ${item.location}` : ""}
                    </Text>
                  </View>
                  {isBusy && <ActivityIndicator size="small" color={themeColors.primary} />}
                </View>
                <View className="flex-row items-stretch border-t border-border">
                  {item.status !== "active" && (
                    <RowAction icon={Check} label="Activate" color="#059669" onPress={() => setStatusFor(item.id, "active")} disabled={isBusy} />
                  )}
                  {item.status !== "paused" && (
                    <RowAction icon={Pause} label="Pause" color={themeColors.primary} onPress={() => setStatusFor(item.id, "paused")} disabled={isBusy} />
                  )}
                  {item.status !== "removed" && (
                    <RowAction icon={Ban} label="Remove" color="#d97706" onPress={() => setStatusFor(item.id, "removed")} disabled={isBusy} />
                  )}
                  <RowAction icon={Trash2} label="Delete" color={themeColors.destructive} onPress={() => hardDelete(item.id)} disabled={isBusy} />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

export default function AdminServicesScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Service Moderation</Text>
        </View>
        <AdminServicesContent />
      </SafeAreaView>
    </AdminGate>
  );
}
